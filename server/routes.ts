import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateVideo, type GenerateVideoParams } from "./services/geminiService";
import { createChatService } from "./services/chatService";
import { createPromptService } from "./services/promptService";
import { createImageService } from "./services/imageService";
import { authMiddleware } from "./middleware/authMiddleware";
import { deductCredits } from "./services/webhookService";
import { ReferenceImage } from "./types";

// Store chat instances per session
const chatInstances = new Map<string, any>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const chatService = await createChatService();
  const promptService = await createPromptService();
  const imageService = await createImageService();

  // Video Generation API (Protected)
  app.post("/api/video/generate", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuário não autenticado" });

      const params: GenerateVideoParams = req.body;
      if (!params.prompt) {
        return res.status(400).json({ error: "Prompt é obrigatório" });
      }

      const deductResult = await deductCredits(req.user.id, "video");
      if (!deductResult.success) {
        return res.status(402).json(deductResult);
      }

      const result = await generateVideo(params);
      res.json({ ...result, creditsRemaining: deductResult.creditsRemaining });
    } catch (error) {
      console.error("Video generation error:", error);
      const message = error instanceof Error ? error.message : "Erro ao gerar vídeo";
      res.status(500).json({ error: message });
    }
  });

  // Chat API - Send Message (Protected)
  app.post("/api/chat/send-message", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuário não autenticado" });

      const { conversationId, message, history } = req.body;
      if (!message) return res.status(400).json({ error: "Mensagem é obrigatória" });
      if (!conversationId) return res.status(400).json({ error: "ID da conversa é obrigatório" });

      const deductResult = await deductCredits(req.user.id, "chat");
      if (!deductResult.success) {
        return res.status(402).json(deductResult);
      }

      if (!chatInstances.has(conversationId)) {
        chatInstances.set(conversationId, chatService.createChat(history));
      }

      const chat = chatInstances.get(conversationId);
      const result = await chatService.sendMessage(chat, message);

      res.json({ text: result.text, creditsRemaining: deductResult.creditsRemaining });
    } catch (error) {
      console.error("Chat error:", error);
      const message = error instanceof Error ? error.message : "Erro ao enviar mensagem";
      res.status(500).json({ error: message });
    }
  });

  // Chat API - Generate Title
  app.post("/api/chat/generate-title", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "Texto é obrigatório" });

      const title = await chatService.generateTitle(text);
      res.json({ title });
    } catch (error) {
      console.error("Title generation error:", error);
      const message = error instanceof Error ? error.message : "Erro ao gerar título";
      res.status(500).json({ error: message });
    }
  });

  // Chat API - Clear chat instance
  app.post("/api/chat/clear-session", async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.body;
      if (!conversationId) return res.status(400).json({ error: "ID da conversa é obrigatório" });

      chatInstances.delete(conversationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao limpar sessão" });
    }
  });

  // Prompt Generation API (Protected)
  app.post("/api/prompt/generate", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuário não autenticado" });

      const { userInput, imageBase64, mimeType } = req.body;
      if (!userInput?.trim() && !imageBase64) {
        return res.status(400).json({ error: "Envie uma imagem ou um texto" });
      }

      const deductResult = await deductCredits(req.user.id, "prompt");
      if (!deductResult.success) {
        return res.status(402).json(deductResult);
      }

      const result = await promptService.generateCreativePrompt({
        userText: userInput,
        imageBase64,
        mimeType,
      });

      res.json({ prompt: result, creditsRemaining: deductResult.creditsRemaining });
    } catch (error) {
      console.error("Prompt generation error:", error);
      const message = error instanceof Error ? error.message : "Erro ao gerar prompt";
      res.status(500).json({ error: message });
    }
  });

  // ✅ Image Generation API (Protected) corrigida para múltiplas imagens
  app.post("/api/image/generate", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuário não autenticado" });

      const { prompt, aspectRatio = "1:1", referenceImages } = req.body as {
        prompt: string;
        aspectRatio: string;
        referenceImages: ReferenceImage[];
      };

      if ((!prompt || !prompt.trim()) && (!referenceImages || referenceImages.length === 0)) {
        return res.status(400).json({ error: "Descrição ou imagens de referência são obrigatórias" });
      }

      const deductResult = await deductCredits(req.user.id, "image");
      if (!deductResult.success) {
        return res.status(402).json(deductResult);
      }

      const result = await imageService.generateImage(
        prompt,
        aspectRatio,
        referenceImages || []
      );

      res.json({ ...result, creditsRemaining: deductResult.creditsRemaining });
    } catch (error) {
      console.error("Image generation error:", error);
      const message = error instanceof Error ? error.message : "Erro ao gerar imagem";
      res.status(500).json({ error: message });
    }
  });

  return httpServer;
}
