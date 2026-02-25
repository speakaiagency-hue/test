import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage"; // ✅ importa a instância correta

declare global {
  namespace Express {
    interface Request {
      userCredits?: number;
    }
  }
}

export async function creditsCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      console.warn("⚠️ CreditsMiddleware - req.user não definido");
      return res.status(401).json({ error: "Não autenticado" });
    }

    const creditsData = await storage.getUserCredits(req.user.id);
    console.log("🔎 CreditsMiddleware - retorno do storage:", creditsData);

    if (!creditsData) {
      console.warn(`⚠️ CreditsMiddleware - Usuário ${req.user.id} não encontrado`);
      return res.status(404).json({ error: "user_not_found", message: "Usuário não encontrado" });
    }

    req.userCredits = creditsData.credits;
    console.log(`💳 CreditsMiddleware - Usuário ${req.user.id} tem ${req.userCredits} créditos`);

    if (req.userCredits <= 0) {
      console.warn(`⚠️ CreditsMiddleware - Usuário ${req.user.id} sem créditos`);
      return res.status(402).json({
        error: "insufficient_credits",
        message: `Você precisa de créditos para continuar. Saldo atual: ${req.userCredits}`,
        creditsRemaining: req.userCredits,
      });
    }

    // ➕ expõe créditos restantes para qualquer rota que venha depois
    res.locals.creditsRemaining = req.userCredits;
    console.log(`✅ CreditsMiddleware - Créditos validados: ${req.userCredits} restantes`);

    next();
  } catch (error) {
    console.error("🔥 CreditsMiddleware error:", error);
    res.status(500).json({ error: "Erro ao verificar créditos" });
  }
}
