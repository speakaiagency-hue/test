import { GoogleGenAI, Modality } from "@google/genai";
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
      return await rotator.executeWithRotation(async () => {
        // ✅ Inicializa cliente para Vertex AI (usa credenciais do Google Cloud)
        const ai = new GoogleGenAI({ vertexai: true });

        // Monta partes: imagens de referência + texto
        const parts: any[] = [];

        referenceImages.slice(0, 3).forEach((img) => {
          parts.push({
            inlineData: {
              mimeType: img.mimeType || "image/jpeg",
              data: img.data.includes(",") ? img.data.split(",")[1] : img.data,
            },
          });
        });

        parts.push({
          text: prompt?.trim() || "Uma arte digital cinematográfica e detalhada",
        });

        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image-preview", // modelo Vertex AI
            contents: { role: "user", parts },
            config: {
              responseModalities: [Modality.IMAGE, Modality.TEXT],
              imageConfig: {
                aspectRatio,
                imageSize,
                numberOfImages,
                personGeneration,
              },
              systemInstruction:
                "Você é um editor de imagem profissional. Preserve a identidade do sujeito e só altere o que for explicitamente pedido.",
            },
          });

          const imagePart = response.candidates?.[0]?.content?.parts?.find(
            (p: any) => p.inlineData
          );

          if (imagePart?.inlineData) {
            return {
              images: [
                `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
              ],
              model: "Gemini 2.5 Flash Image",
            };
          }

          return {
            images: [],
            model: "Gemini 2.5 Flash Image",
            message:
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
