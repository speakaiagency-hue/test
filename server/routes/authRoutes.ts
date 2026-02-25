import type { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateToken, authMiddleware } from "../middleware/authMiddleware";
import type { IStorage } from "../storage";
import { createKiwifyService } from "../services/kiwifyService";

export async function registerAuthRoutes(app: Express, storage: IStorage) {
  const kiwifyService = await createKiwifyService();

  // ✅ Registro de novo usuário
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      let { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, senha e nome são obrigatórios" });
      }

      // Normaliza email para minúsculas
      email = email.toLowerCase();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email inválido" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email já cadastrado" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        username: email,
        password: hashedPassword,
      });

      await storage.updateUserProfile(newUser.id, { email, name });

      // 🔄 Verifica compras pendentes no registro
      const pendingPurchases = await storage.findPendingPurchasesByEmail(email);
      for (const purchase of pendingPurchases) {
        if (purchase.status === "approved" && !purchase.used) {
          await storage.addCredits(newUser.id, purchase.credits, purchase.purchaseId);
          await storage.markPendingAsUsed(purchase.purchaseId);
          console.log(`✅ Créditos liberados do pagamento antecipado para ${email}`);
        }
      }

      const token = generateToken(newUser.id, email, name);

      res.status(201).json({
        success: true,
        message: "Conta criada com sucesso",
        token,
        user: { id: newUser.id, email, name },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Erro ao criar conta" });
    }
  });

  // ✅ Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      let { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      // Normaliza email para minúsculas
      email = email.toLowerCase();

      const user = await storage.getUserByEmail(email);

      if (!user || typeof user.password !== "string") {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      // 🔄 Verifica compras pendentes também no login
      const pendingPurchases = await storage.findPendingPurchasesByEmail(email);
      for (const purchase of pendingPurchases) {
        if (purchase.status === "approved" && !purchase.used) {
          await storage.addCredits(user.id, purchase.credits, purchase.purchaseId);
          await storage.markPendingAsUsed(purchase.purchaseId);
          console.log(`✅ Créditos aplicados no login para ${email}`);
        }
      }

      const token = generateToken(user.id, user.email || email, user.name || undefined);

      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email || email, name: user.name },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  // ✅ Verificação de membership
  app.get("/api/auth/check-membership", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user || !user.email) {
        return res.json({ hasMembership: false });
      }

      const credits = await storage.getUserCredits(user.id);
      if (credits?.credits > 0) {
        return res.json({ hasMembership: true, credits: credits.credits });
      }

      const hasMembership = await kiwifyService.hasAnyPurchase(user.email.toLowerCase());
      res.json({ hasMembership });
    } catch (error) {
      console.error("Check membership error:", error);
      res.status(500).json({ error: "Erro ao verificar acesso" });
    }
  });

  // ✅ Atualizar avatar
  app.post("/api/auth/update-avatar", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { avatar } = req.body;
      if (!avatar) return res.status(400).json({ error: "Avatar é obrigatório" });

      const updatedUser = await storage.updateUserAvatar(req.user!.id, avatar);
      if (!updatedUser) return res.status(404).json({ error: "Usuário não encontrado" });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Avatar update error:", error);
      res.status(500).json({ error: "Erro ao atualizar avatar" });
    }
  });

  // ✅ Atualizar perfil
  app.post("/api/auth/update-profile", authMiddleware, async (req: Request, res: Response) => {
    try {
      let { name, email } = req.body;
      if (!name || !email) return res.status(400).json({ error: "Nome e email são obrigatórios" });

      // Normaliza email
      email = email.toLowerCase();

      const updatedUser = await storage.updateUserProfile(req.user!.id, { name, email });
      if (!updatedUser) return res.status(404).json({ error: "Usuário não encontrado" });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
  });

  // ✅ Alterar senha
  app.post("/api/auth/change-password", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Nova senha deve ter no mínimo 6 caracteres" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user || typeof user.password !== "string") {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updated = await storage.updateUserPassword(req.user!.id, hashedPassword);
      if (!updated) return res.status(404).json({ error: "Usuário não encontrado" });

      res.json({ success: true, message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Erro ao alterar senha" });
    }
  });
}
