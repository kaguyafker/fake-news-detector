-- Add is_banned to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Add Foreign Key to verifications for easier joining (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'verifications_user_id_fkey'
    ) THEN
        ALTER TABLE public.verifications 
        ADD CONSTRAINT verifications_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Function to toggle ban status
CREATE OR REPLACE FUNCTION public.toggle_ban(user_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status BOOLEAN;
BEGIN
  -- Check if requestor is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT is_banned INTO current_status FROM public.profiles WHERE id = user_id_input;
  
  UPDATE public.profiles 
  SET is_banned = NOT COALESCE(current_status, false)
  WHERE id = user_id_input;

  RETURN NOT COALESCE(current_status, false);
END;
$$;

-- Allow admins to update profiles (for banning)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to view all verifications
CREATE POLICY "Admins can view all verifications"
  ON public.verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to promote kaguyafker@gmail.com to admin
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Try to find the user in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'kaguyafker@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Insert admin role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
