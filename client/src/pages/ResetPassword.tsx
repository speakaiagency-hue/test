import { useState } from "react";
import { Mail, Lock, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao redefinir senha");
      }

      setSuccess("Senha redefinida com sucesso!");
      toast({ title: "Senha redefinida com sucesso!", variant: "default" });

      // Redireciona para login após redefinição
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao redefinir senha";
      setError(message);
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Card className="w-full max-w-md border-border/50 shadow-2xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <img src="/speak-ai-logo.png" alt="Speak AI" className="h-16 object-contain" />
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <p className="text-muted-foreground text-sm">
            Digite seu e-mail e escolha uma nova senha
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10 border-border/50 bg-secondary/30 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10 border-border/50 bg-secondary/30 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pl-10 border-border/50 bg-secondary/30 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-100 border border-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

            {/* Reset Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-12 font-semibold shadow-lg shadow-indigo-500/20"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redefinindo...
                </span>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
