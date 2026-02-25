import { Coins, AlertCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { getAuthHeader } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface CreditsDisplayProps {
  operationCost: number;
  operationName: string;
  creditsAfterOperation?: number;
  onBuyCredits?: () => void; // 🔑 abre o CreditsModal
}

export function CreditsDisplay({
  operationCost,
  operationName,
  creditsAfterOperation,
  onBuyCredits,
}: CreditsDisplayProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
    const interval = setInterval(fetchCredits, 2000);
    return () => clearInterval(interval);
  }, [creditsAfterOperation]);

  const fetchCredits = async () => {
    try {
      const response = await fetch("/api/credits/balance", {
        headers: getAuthHeader(),
      });
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      } else {
        console.error("Erro ao buscar créditos:", response.status);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasEnoughCredits = credits !== null && credits >= operationCost;
  const lowCredits = credits !== null && credits <= 50; // 🔑 regra de alerta

  return (
    <div className="space-y-2">
      {/* Saldo de Créditos */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <span className="text-xs text-muted-foreground">Disponível</span>
        <div
          className={cn(
            "text-lg font-bold",
            loading ? "text-gray-500" : hasEnoughCredits ? "text-green-400" : "text-red-400"
          )}
        >
          {loading ? "..." : credits}
        </div>
      </div>

      {/* Custo da Operação */}
      <div
        className={cn(
          "flex items-center justify-between p-2 rounded text-xs",
          hasEnoughCredits ? "text-blue-400" : "text-red-400"
        )}
      >
        <span>Custo {operationName}</span>
        <span className="font-semibold">-{operationCost}</span>
      </div>

      {/* Aviso de Créditos Baixos ou Insuficientes */}
      {!loading && (lowCredits || !hasEnoughCredits) && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
            <div className="text-xs text-red-400">
              {lowCredits
                ? "Seu saldo está baixo. Compre mais créditos!"
                : `Precisa de ${operationCost} créditos. Compre mais!`}
            </div>
          </div>
          <button
            onClick={onBuyCredits}
            className="w-full h-8 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg flex items-center justify-center gap-1 cursor-pointer"
            data-testid="button-buy-credits"
          >
            <Plus className="w-3 h-3" />
            Comprar Créditos
          </button>
        </div>
      )}

      {/* Créditos após operação */}
      {creditsAfterOperation !== undefined && (
        <div className="flex items-center justify-between p-2 rounded text-xs bg-green-500/5 text-green-400">
          <span>Após operação</span>
          <span className="font-semibold">{creditsAfterOperation}</span>
        </div>
      )}
    </div>
  );
}
