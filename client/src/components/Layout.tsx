import { useLocation } from "wouter";
import { MessageSquare, Type, Image as ImageIcon, Video, LayoutDashboard, Menu, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlansModal } from "./PlansModal";
import { CreditsModal } from "./CreditsModal";
import { UserMenu } from "./UserMenu";
import { isAuthenticated, getAuthHeader } from "@/lib/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [hasMembership, setHasMembership] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    setIsLogged(isAuthenticated());
    
    if (isAuthenticated()) {
      checkMembership();
      const interval = setInterval(checkMembership, 10000);
      return () => clearInterval(interval);
    }
  }, []);

  const checkMembership = async () => {
    try {
      const response = await fetch("/api/auth/check-membership", {
        headers: getAuthHeader(),
      });
      if (response.ok) {
        const data = await response.json();
        setHasMembership(data.hasMembership);
        if (data.hasMembership) {
          fetchCredits();
        }
      }
    } catch (error) {
      console.error("Error checking membership:", error);
    }
  };

  const fetchCredits = async () => {
    try {
      const response = await fetch("/api/credits/balance", {
        headers: getAuthHeader(),
      });
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Início" },
    { href: "/chat", icon: MessageSquare, label: "Chat IA" },
    { href: "/prompt", icon: Type, label: "Gerador de Prompt" },
    { href: "/image", icon: ImageIcon, label: "Gerar Imagem" },
    { href: "/video", icon: Video, label: "Gerar Vídeo" },
  ];

  const handleNavigate = (href: string) => {
    setLocation(href);
    setIsOpen(false);
  };

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location === item.href;
    return (
      <button
        onClick={() => handleNavigate(item.href)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left",
          isActive
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-current")} />
        <span>{item.label}</span>
        {isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed h-full z-50 glass bg-background/80 backdrop-blur-xl transition-all duration-300">
        <div className="p-4 flex items-center justify-start h-auto py-3">
          <img src="/speak-ai-logo.png" alt="Speak AI" className="h-10 object-contain" />
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 text-[14px] pl-[9px] pr-[9px] pt-[24px] pb-[24px]">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="p-4 space-y-2"></div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between p-4 h-16">
          <img src="/speak-ai-logo.png" alt="Speak AI" className="h-8 object-contain" />
          <div className="flex items-center gap-3">
            {isLogged && hasMembership && credits !== null && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-500/10 text-sm font-semibold text-indigo-400">
                <Zap className="w-4 h-4" />
                {credits}
              </div>
            )}
            {isLogged ? (
              <UserMenu />
            ) : (
              <Button
                size="sm"
                className="bg-white text-indigo-600 hover:bg-gray-100 rounded-full font-semibold"
                onClick={() => setLocation("/login")}
              >
                Login
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="absolute top-20 left-0 right-0 bg-background/95 backdrop-blur-xl p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
            <div className="pt-4 space-y-2 mt-4">
              {isLogged && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMembership}
                  className={`w-full text-xs justify-start transition-all ${
                    hasMembership
                      ? "text-foreground hover:bg-secondary/50 cursor-pointer"
                      : "text-muted-foreground/50 cursor-not-allowed opacity-50"
                  }`}
                  onClick={() => {
                    if (hasMembership) {
                      setCreditsOpen(true);
                      setIsOpen(false);
                    }
                  }}
                  title={hasMembership ? "Clique para gerenciar créditos" : "Compre um plano para ver créditos"}
                >
                  <Zap className="w-3 h-3 mr-2" />
                  Créditos
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-foreground hover:bg-secondary/50 text-xs justify-start"
                onClick={() => setIsOpen(false)}
              >
                Personalizado
              </Button>
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs justify-start"
                onClick={() => {
                  setPlansOpen(true);
                  setIsOpen(false);
                }}
              >
                Planos
              </Button>
              {!isLogged && (
                <Button
                  size="sm"
                  className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-semibold text-xs justify-start"
                  onClick={() => {
                    setLocation("/login");
                    setIsOpen(false);
                  }}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

           {/* Main Content */}
      <main className="flex-1 md:pl-64 min-h-screen pt-24 md:pt-0 bg-background">
        {/* Top Bar (desktop) sem borda */}
        <div className="hidden md:flex fixed top-0 right-0 left-64 h-20 bg-background/80 backdrop-blur-xl items-center justify-between px-6 z-30">
          <div />
          <div className="flex items-center gap-3">
            {isLogged && hasMembership && credits !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 font-semibold text-indigo-400">
                <Zap className="w-4 h-4" />
                {credits}
              </div>
            )}
            {isLogged && (
              <Button
                variant="outline"
                disabled={!hasMembership}
                className={cn(
                  "rounded-full transition-all",
                  hasMembership
                    ? "text-foreground hover:bg-secondary/50 cursor-pointer"
                    : "text-muted-foreground/50 cursor-not-allowed opacity-50"
                )}
                onClick={() => hasMembership && setCreditsOpen(true)}
                title={
                  hasMembership
                    ? "Clique para gerenciar créditos"
                    : "Compre um plano para ver créditos"
                }
              >
                <Zap className="w-4 h-4 mr-2" />
                Créditos
              </Button>
            )}
            <Button
              variant="outline"
              className="text-foreground hover:bg-secondary/50 rounded-full"
              onClick={() => {}}
            >
              Personalizado
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/20"
              onClick={() => setPlansOpen(true)}
            >
              Planos
            </Button>
            {isLogged ? (
              <UserMenu />
            ) : (
              <Button
                className="bg-white text-indigo-600 hover:bg-gray-100 rounded-full font-semibold"
                onClick={() => setLocation("/login")}
              >
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Container do conteúdo das páginas */}
        <div className="max-w-7xl mx-auto p-6 lg:p-12 animate-in fade-in duration-500 slide-in-from-bottom-4 md:mt-20">
          {children}
        </div>
      </main>

      {/* Modais */}
      <PlansModal open={plansOpen} onOpenChange={setPlansOpen} />
      <CreditsModal open={creditsOpen} onOpenChange={setCreditsOpen} />
    </div>
  );
}
