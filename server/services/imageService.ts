import { GoogleGenAI } from "@google/genai";
import { getGeminiKeyRotator } from "../utils/apiKeyRotator";
import { ReferenceImage } from "../types"; // garante tipagem consistente

export async function createImageService() {
  const rotator = getGeminiKeyRotator();

  return {
    async generateImage(
      prompt: string,
      aspectRatio: string = "1:1",
      resolution: "512px" | "0.5K" | "1K" | "2K" | "4K" = "1K",
      referenceImages: ReferenceImage[] = [] // aceita várias imagens
    ): Promise<{ images: string[]; model: string; message?: string }> {
      return await rotator.executeWithRotation(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });

        // Validação de resolução
        const validResolutions = ["512px", "0.5K", "1K", "2K", "4K"];
        if (!validResolutions.includes(resolution)) {
          throw new Error("Resolução inválida. Use 512px, 0.5K, 1K, 2K ou 4K.");
        }

        // Validação de aspect ratio
        const validAspectRatios = ["1:1", "16:9", "9:16", "1:4", "4:1", "1:8", "8:1"];
        if (!validAspectRatios.includes(aspectRatio)) {
          throw new Error("Aspect ratio inválido. Use 1:1, 16:9, 9:16, 1:4, 4:1, 1:8 ou 8:1.");
        }

        // Monta os "parts": imagens válidas
        const parts: any[] = referenceImages
          .filter((img) => img?.data && img?.mimeType)
          .map((img) => ({
            inline_data: {
              data: img.data.includes(",") ? img.data.split(",")[1] : img.data,
              mime_type: img.mimeType,
            },
          }));

        // Sempre adiciona o prompt no final (fallback se vazio)
        parts.push({
          text: prompt?.trim() || "Uma arte digital cinematográfica e detalhada",
        });

        // Chamada ao modelo Gemini 3 Pro Image Preview
        const geminiResponse = await ai.models.generateContent({
          model: "gemini-3-pro-image-preview",
          contents: [{ role: "user", parts }],
          config: {
            response_modalities: ["IMAGE"],
            image_config: {
              aspect_ratio: aspectRatio,
              image_size: resolution,
            },
          },
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
          },
        });

        // Debug opcional
        console.log("Gemini response:", JSON.stringify(geminiResponse, null, 2));
        console.log("Finish reason:", geminiResponse.candidates?.[0]?.finishReason);

        const images: string[] = [];

        if (geminiResponse.candidates?.[0]?.content?.parts) {
          for (const part of geminiResponse.candidates[0].content.parts) {
            if (part.inline_data) {
              const base64EncodeString: string = part.inline_data.data || "";
              const mimeType = part.inline_data.mime_type;
              images.push(`data:${mimeType};base64,${base64EncodeString}`);
            } else if (part.text) {
              // Se vier texto em vez de imagem, logamos para debug
              console.log("Modelo retornou texto:", part.text);
            }
          }
        }

        if (images.length > 0) {
          return {
            images,
            model: "Gemini 3 Pro Image",
          };
        }

        // Retorno amigável para o frontend
        return {
          images: [],
          model: "Gemini 3 Pro Image",
          message: "A resposta da API não continha uma imagem. Tente ajustar o prompt ou a configuração.",
        };
      });
    },
  };
}
