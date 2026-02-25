import { LogOut, User as UserIcon, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getUser, clearAuth, getAuthHeader } from "@/lib/auth";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserMenu() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState(getUser());
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleLogout = () => {
    clearAuth();
    setLocation("/login");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        const authHeader = getAuthHeader();
        if (authHeader.Authorization) {
          (headers as Record<string, string>).Authorization = authHeader.Authorization;
        }
        const response = await fetch("/api/auth/update-avatar", {
          method: "POST",
          headers,
          body: JSON.stringify({ avatar: base64 }),
        });

        if (!response.ok) throw new Error("Erro ao atualizar avatar");

        const updatedUser = { ...user, avatar: base64 };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast({ title: "Avatar atualizado com sucesso!" });
      } catch (error) {
        toast({ title: "Erro ao atualizar avatar", variant: "destructive" });
      }
    };
    reader.readAsDataURL(file);
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-indigo-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-indigo-600 text-white text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1 hover:bg-indigo-700 transition"
              >
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setLocation("/profile")}
            className="cursor-pointer"
          >
            <UserIcon className="w-4 h-4 mr-2" />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
