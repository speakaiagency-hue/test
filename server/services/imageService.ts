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
      numberOfImages: number = 4,
      personGeneration: PersonGeneration = "allow_adult",
      referenceImages: ReferenceImage[] = []
    ): Promise<GenerationResult> {
      return await rotator.executeWithRotation(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });

        // Monta os "parts": primeiro imagens, depois texto
        const parts: any[] = referenceImages
          .filter((img) => img?.data && img?.mimeType)
          .map((img) => ({
            inlineData: {
              data: img.data.includes(",") ? img.data.split(",")[1] : img.data,
              mimeType: img.mimeType,
            },
          }));

        // Sempre adiciona o prompt no final
        parts.push({
          text: prompt?.trim() || "Uma arte digital cinematográfica e detalhada",
        });

        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [{ role: "user", parts }],
            config: {
              responseModalities: [Modality.IMAGE],
              imageConfig: {
                aspectRatio,
                imageSize,
                numberOfImages,
                personGeneration,
              } as any,
              temperature: 0.2,
              topP: 0.8,
              topK: 40,
            } as any,
          });

          const images: string[] = [];
          let message: string | undefined;

          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                images.push(`data:${mimeType};base64,${base64Data}`);
              } else if (part.text) {
                message = part.text;
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
