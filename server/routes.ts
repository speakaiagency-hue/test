import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { createImageService } from "./services/imageService";
import { authMiddleware } from "./middleware/authMiddleware";
import { deductCredits } from "./services/webhookService";
import { ReferenceImage } from "./types";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const imageService = await createImageService();

  // ✅ Image Generation API (Protected)
  app.post("/api/image/generate", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { prompt, aspectRatio = "1:1", resolution = "1K", referenceImages } = req.body as {
        prompt: string;
        aspectRatio: string;
        resolution?: string;
        referenceImages: ReferenceImage[];
      };

      if ((!prompt || !prompt.trim()) && (!referenceImages || referenceImages.length === 0)) {
        return res.status(400).json({ error: "Descrição ou imagens de referência são obrigatórias" });
      }

      const deductResult = await deductCredits(req.user.id, "image", { resolution });
      if (!deductResult.success) {
        return res.status(402).json(deductResult);
      }

      const result = await imageService.generateImage(
        prompt,
        aspectRatio,
        resolution || "1K",
        referenceImages || []
      );

      if (!result.images || result.images.length === 0) {
        return res.json({
          images: [],
          message: result.message || "Nenhuma imagem gerada",
          creditsRemaining: deductResult.creditsRemaining,
          model: result.model,
        });
      }

      res.json({
        images: result.images,
        message: result.message, // pode vir texto explicativo do modelo
        creditsRemaining: deductResult.creditsRemaining,
        model: result.model,
      });
    } catch (error) {
      console.error("Image generation error:", error);
      const message = error instanceof Error ? error.message : "Erro ao gerar imagem";
      res.status(500).json({ error: message });
    }
  });

  return httpServer;
}
