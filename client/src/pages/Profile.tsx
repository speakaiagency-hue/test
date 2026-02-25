import { useState, useRef } from "react";
import { User, Mail, Lock, Camera, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getUser, clearAuth, getAuthHeader } from "@/lib/auth";

export default function Profile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState(getUser());
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;

      // garante que tenha prefixo data:image
      const avatarData = base64.startsWith("data:")
        ? base64
        : `data:image/png;base64,${base64}`;

      try {
        // aqui você poderia enviar para backend se tivesse
        // mas vamos apenas salvar no localStorage
        const updatedUser = { ...user, avatar: avatarData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast({ title: "Avatar atualizado!" });
      } catch {
        toast({ title: "Erro ao atualizar avatar", variant: "destructive" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateInfo = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const authHeader = getAuthHeader();
      if (authHeader.Authorization) {
        (headers as Record<string, string>).Authorization = authHeader.Authorization;
      }
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");
      const { user: updated } = await response.json();
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setIsEditing(false);
      toast({ title: "Perfil atualizado!" });
    } catch {
      toast({ title: "Erro ao atualizar perfil", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const authHeader = getAuthHeader();
      if (authHeader.Authorization) {
        (headers as Record<string, string>).Authorization = authHeader.Authorization;
      }
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers,
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) throw new Error("Erro ao alterar senha");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Senha alterada com sucesso!" });
    } catch {
      toast({ title: "Erro ao alterar senha", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setLocation("/login");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-heading font-bold">Meu Perfil</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      {/* Avatar Section */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Foto do Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <Avatar className="h-24 w-24">
            {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
            <AvatarFallback className="bg-indigo-600 text-white text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Camera className="w-4 h-4 mr-2" />
            Mudar Foto
          </Button>
        </CardContent>
      </Card>

      {/* Informações Pessoais */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancelar" : "Editar"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/30"
                />
              </div>
              <Button
                onClick={handleUpdateInfo}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{user.name}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground" />
                             <span>{user.email}</span>
            </div>
          </>
        )}
      </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nova Senha</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
              className="bg-secondary/30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmar Senha</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              className="bg-secondary/30"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isLoading || !newPassword}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? "Atualizando..." : "Atualizar Senha"}
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
