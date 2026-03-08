import { GoogleGenAI } from "@google/genai";
import { getGeminiKeyRotator } from "../utils/apiKeyRotator";
import { ReferenceImage } from "../types";

export async function createImageService() {
  const rotator = getGeminiKeyRotator();

  return {
    async generateImage(
      prompt: string,
      aspectRatio: string = "1:1",
      resolution: "512px" | "1K" | "2K" | "4K" = "2K",
      referenceImages: ReferenceImage[] = []
    ): Promise<{ images: string[]; model: string; message?: string }> {
      return await rotator.executeWithRotation(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });

        // Validação de resolução
        const validResolutions = ["512px", "1K", "2K", "4K"];
        if (!validResolutions.includes(resolution)) {
          throw new Error("Resolução inválida. Use 512px, 1K, 2K ou 4K.");
        }

        // Monta os "parts": primeiro imagens válidas, depois texto
        const parts: any[] = referenceImages
          .filter((img) => img?.data && img?.mimeType)
          .map((img) => ({
            inline_data: {
              data: img.data.includes(",") ? img.data.split(",")[1] : img.data,
              mime_type: img.mimeType,
            },
          }));

        // Prompt padrão se vier vazio
        parts.push({
          text: prompt?.trim() || "Uma foto hiper-realista cinematográfica e detalhada",
        });

        // Chamada ao modelo
        const geminiResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-image-preview", // ou "gemini-3-pro-image-preview"
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

        // Debug detalhado
        console.log("Gemini response:", JSON.stringify(geminiResponse, null, 2));
        console.log("Finish reason:", geminiResponse.candidates?.[0]?.finishReason);

        const images: string[] = [];

        if (geminiResponse.candidates?.[0]?.content?.parts) {
          for (const part of geminiResponse.candidates[0].content.parts) {
            if (part.inline_data) {
              const base64EncodeString: string = part.inline_data.data || "";
              const mimeType = part.inline_data.mime_type;
              images.push(`data:${mimeType};base64,${base64EncodeString}`);
            }
          }
        }

        if (images.length > 0) {
          return {
            images,
            model: "Gemini 3.1 Flash Image",
          };
        }

        // Retorno amigável para o frontend
        return {
          images: [],
          model: "Gemini 3.1 Flash Image",
          message: "A resposta da API não continha uma imagem. Tente ajustar o prompt ou a configuração.",
        };
      });
    },
  };
}
