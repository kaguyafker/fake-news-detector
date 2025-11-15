-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table (CRITICAL: roles stored separately for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create item_tags junction table (many-to-many)
CREATE TABLE public.item_tags (
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

-- Create activity_log table
CREATE TYPE public.activity_action AS ENUM ('create', 'update', 'delete', 'login');
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action activity_action NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_items_owner ON public.items(owner_id);
CREATE INDEX idx_activity_log_actor ON public.activity_log(actor_id);
CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Log the registration
  INSERT INTO public.activity_log (actor_id, action, entity_type, entity_id)
  VALUES (NEW.id, 'login', 'user', NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for items
CREATE POLICY "Anyone can view items"
  ON public.items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create items"
  ON public.items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own items"
  ON public.items FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own items"
  ON public.items FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tags
CREATE POLICY "Anyone can view tags"
  ON public.tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create tags"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for item_tags
CREATE POLICY "Anyone can view item_tags"
  ON public.item_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Item owners can manage tags"
  ON public.item_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_tags.item_id
      AND items.owner_id = auth.uid()
    )
  );

-- RLS Policies for activity_log
CREATE POLICY "Users can view own activity"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = actor_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert activity"
  ON public.activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);