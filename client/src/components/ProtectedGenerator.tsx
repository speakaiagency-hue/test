import { useEffect, useState } from "react";
import { getAuthHeader, isAuthenticated } from "@/lib/auth";
import { useLocation } from "wouter";

export function withMembershipCheck<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProtectedComponent(props: P) {
    const [, setLocation] = useLocation();
    const [hasMembership, setHasMembership] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!isAuthenticated()) {
        setLocation("/login");
        return;
      }

      checkMembership();
    }, []);

    const checkMembership = async () => {
      try {
        const response = await fetch("/api/auth/check-membership", {
          headers: getAuthHeader(),
        });
        if (response.ok) {
          const data = await response.json();
          if (!data.hasMembership) {
            console.log("No membership, redirecting to home");
            setLocation("/");
          } else {
            console.log("✅ Membership granted");
            setHasMembership(true);
          }
        } else {
          console.error("Membership check failed:", response.status);
          setLocation("/");
        }
      } catch (error) {
        console.error("Error checking membership:", error);
        setLocation("/");
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Verificando acesso...</div>
        </div>
      );
    }

    if (!hasMembership) {
      return null;
    }

    return <Component {...props} />;
  };
}
