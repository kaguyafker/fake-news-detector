import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isCheckingBan, setIsCheckingBan] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    async function checkBan() {
      if (!user) {
        if (mounted) setIsCheckingBan(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_banned')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error checking ban status:", error);
          // If error (e.g. network), we might default to allow, or block. 
          // For now, allow but log.
        }

        if (data?.is_banned) {
          toast({
            title: "Account Banned",
            description: "Your account has been suspended. Please contact support.",
            variant: "destructive",
          });
          await signOut();
          return;
        }
      } catch (e) {
        console.error("Exception checking ban:", e);
      } finally {
        if (mounted) setIsCheckingBan(false);
      }
    }

    if (!authLoading) {
      if (!user) {
        navigate("/login");
        setIsCheckingBan(false);
      } else {
        checkBan();
      }
    }

    return () => {
      mounted = false;
    };
  }, [user, authLoading, navigate, signOut, toast]);

  if (authLoading || (user && isCheckingBan)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
