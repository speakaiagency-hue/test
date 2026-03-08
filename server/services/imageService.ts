import { GoogleGenAI } from "@google/genai";
import { getGeminiKeyRotator } from "../utils/apiKeyRotator";
import {
  ReferenceImage,
  GenerationResult,
  AspectRatio,
  ImageSize,
  PersonGeneration,
} from "../types";

export async function createImageService() {
  const rotator = getGeminiKeyRotator();

  return {
    async generateImage(
      prompt: string,
      aspectRatio: AspectRatio = "1:1",
      imageSize: ImageSize = "1K",
      numberOfImages: number = 1,
      personGeneration: PersonGeneration = "allow_adult",
      referenceImages: ReferenceImage[] = []
    ): Promise<GenerationResult> {
      return await rotator.executeWithRotation(async (apiKey) => {
        // ✅ Inicializa cliente para Vertex AI
        const ai = new GoogleGenAI({
          apiKey,
          vertexai: true, // força chamadas para Vertex AI
        });

        // Configuração base
        const config: Record<string, any> = {
          aspectRatio,
          imageSize,
          numberOfImages,
          personGeneration,
        };

        // Payload inicial
        const generateImagePayload: Record<string, any> = {
          model: "gemini-2.5-flash-image", // modelo Vertex AI
          prompt: prompt?.trim() || "Uma arte digital cinematográfica e detalhada",
          config,
        };

        // Se houver imagens de referência, adiciona no payload
        if (referenceImages.length > 0) {
          const refs = referenceImages.slice(0, 3).map((img) => ({
            image: {
              imageBytes: img.data.includes(",") ? img.data.split(",")[1] : img.data,
              mimeType: img.mimeType || "image/jpeg",
            },
          }));
          generateImagePayload.config.referenceImages = refs;
        }

        try {
          const response = await ai.models.generateImages(generateImagePayload);

          const images: string[] = [];
          let message: string | undefined;

          if (response?.generatedImages?.length) {
            for (const img of response.generatedImages) {
              if (img?.image?.imageBytes) {
                const base64Data = img.image.imageBytes;
                const mimeType = img.image.mimeType || "image/png";
                images.push(`data:${mimeType};base64,${base64Data}`);
              }
            }
          }

          if (images.length > 0) {
            return {
              images,
              model: "Gemini 2.5 Flash Image",
            };
          }

          return {
            images: [],
            model: "Gemini 2.5 Flash Image",
            message:
              message ||
              "A resposta da API não continha uma imagem. Tente ajustar o prompt ou a configuração.",
          };
        } catch (error: any) {
          console.error("Image generation error:", error);
          return {
            images: [],
            model: "Gemini 2.5 Flash Image",
            message:
              error.message || "Ocorreu um erro durante a geração da imagem.",
          };
        }
      });
    },
  };
}
