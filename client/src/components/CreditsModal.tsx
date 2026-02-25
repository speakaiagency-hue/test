import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useState } from "react";
import { isAuthenticated } from "@/lib/auth";

interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const creditPlans = [
  { id: 1, credits: 100, originalPrice: "R$ 97,00", price: "R$ 57,00", kiwifyLink: "https://pay.kiwify.com.br/97ObxqK" },
  { id: 2, credits: 200, originalPrice: "R$ 187,00", price: "R$ 117,00", kiwifyLink: "https://pay.kiwify.com.br/3gpZJ6N" },
  { id: 3, credits: 300, originalPrice: "R$ 287,00", price: "R$ 177,00", kiwifyLink: "https://pay.kiwify.com.br/M2XmJF7" },
  { id: 4, credits: 500, originalPrice: "R$ 477,00", price: "R$ 287,00", popular: true, kiwifyLink: "https://pay.kiwify.com.br/ntcPS8x" },
  { id: 5, credits: 1000, originalPrice: "R$ 957,00", price: "R$ 577,00", kiwifyLink: "https://pay.kiwify.com.br/Tqy289G" },
  { id: 6, credits: 2000, originalPrice: "R$ 1.547,00", price: "R$ 1.147,00", kiwifyLink: "https://pay.kiwify.com.br/f8d7PdX" },
];

export function CreditsModal({ open, onOpenChange }: CreditsModalProps) {
  const [, setLocation] = useLocation();
  const [isLogged] = useState(() => isAuthenticated());

  const handleBuy = (kiwifyLink: string) => {
    if (!isLogged) {
      const encodedUrl = encodeURIComponent(kiwifyLink);
      setLocation(`/signup?redirect=${encodedUrl}`);
      onOpenChange(false);
    } else {
      window.open(kiwifyLink, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-border/50 shadow-2xl shadow-indigo-500/20">
        <DialogHeader className="text-center space-y-4 pb-6">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            <DialogTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Pacotes de Créditos
            </DialogTitle>
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg text-center">Transforme créditos em conteúdo inteligente com IA</p>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-8">
          {creditPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? "border-indigo-500 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-slate-900 shadow-lg shadow-indigo-500/40"
                  : "border-border/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-indigo-400/80 hover:shadow-lg hover:shadow-indigo-500/10"
              } p-6 flex flex-col h-full group min-h-64`}
            >
              <div className="mb-4">
                <div className="text-3xl font-bold text-indigo-300 mb-1 text-center">{plan.credits}</div>
                <p className="text-xs text-muted-foreground text-center">Créditos</p>
              </div>

              <div className="mb-6 space-y-2">
                <div className="text-sm line-through text-muted-foreground text-center">{plan.originalPrice}</div>
                <div className="text-2xl font-bold text-white text-center">{plan.price}</div>
              </div>

              <button
                onClick={() => handleBuy(plan.kiwifyLink)}
                className={`w-full h-9 font-semibold transition-all duration-300 text-sm rounded-lg flex items-center justify-center ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/40 text-white"
                    : "border border-indigo-500/50 text-indigo-300 hover:text-white hover:bg-indigo-500/10 hover:border-indigo-400"
                }`}
                data-testid={`button-buy-credits-${plan.id}`}
              >
                {isLogged ? "Comprar" : "Cadastrar"}
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 pt-6 text-center">
          <p className="text-xs text-muted-foreground">✓ Liberdade total de uso • Suporte personalizado</p>
        </div>

        <style>{`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
