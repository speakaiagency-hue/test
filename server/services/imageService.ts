import { GoogleGenAI } from "@google/genai";
import { getGeminiKeyRotator } from "../utils/apiKeyRotator";
import { ReferenceImage } from "../types"; // garante tipagem consistente

export async function createImageService() {
  const rotator = getGeminiKeyRotator();

  return {
    async generateImage(
      prompt: string,
      aspectRatio: string = "1:1",
      referenceImages: ReferenceImage[] = [] // aceita várias imagens
    ): Promise<{ images: string[]; model: string }> {
      return await rotator.executeWithRotation(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });

        // Monta os "parts": primeiro imagens válidas, depois texto
        const parts: any[] = referenceImages
          .filter((img) => img?.data && img?.mimeType)
          .map((img) => ({
            inline_data: {
              // remove prefixo caso venha no formato data:image/png;base64,...
              data: img.data.includes(",") ? img.data.split(",")[1] : img.data,
              mime_type: img.mimeType,
            },
          }));

        // Sempre adiciona o prompt no final (garantindo que não seja vazio)
        parts.push({
          text: prompt?.trim() || "Uma arte digital cinematográfica e detalhada",
        });

        // Chamada correta para geração de imagem
        const geminiResponse = await ai.models.generateContent({
          // Modelo atual da família Imagen 4
          model: "imagen-4.0-generate-001",
          contents: [{ role: "user", parts }],
          config: {
            imageConfig: { aspectRatio },
          },
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
          },
        });

        // Debug opcional
        console.log("Gemini response:", JSON.stringify(geminiResponse, null, 2));

        const images: string[] = [];

        if (
          geminiResponse.candidates &&
          geminiResponse.candidates[0]?.content?.parts
        ) {
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
            model: "Imagen 4.0",
          };
        }

        throw new Error("A resposta da API não continha uma imagem.");
      });
    },
  };
}
