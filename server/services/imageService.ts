import { GoogleGenAI } from "@google/genai";
import { getGeminiKeyRotator } from "../utils/apiKeyRotator";
import { ReferenceImage } from "../types"; // garante tipagem consistente

export async function createImageService() {
  const rotator = getGeminiKeyRotator();

  return {
    async generateImage(
      prompt: string,
      aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1",
      imageSize: "1K" | "2K" = "1K",
      numberOfImages: number = 4,
      personGeneration: "dont_allow" | "allow_adult" | "allow_all" = "allow_adult",
      referenceImages: ReferenceImage[] = []
    ): Promise<{ images: string[]; model: string; message?: string }> {
      return await rotator.executeWithRotation(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });

        // Validação de parâmetros
        const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
        if (!validAspectRatios.includes(aspectRatio)) {
          throw new Error("Aspect ratio inválido. Use 1:1, 3:4, 4:3, 9:16 ou 16:9.");
        }

        const validSizes = ["1K", "2K"];
        if (!validSizes.includes(imageSize)) {
          throw new Error("Tamanho inválido. Use 1K ou 2K.");
        }

        if (numberOfImages < 1 || numberOfImages > 4) {
          throw new Error("Número de imagens inválido. Use entre 1 e 4.");
        }

        // Monta os "parts": imagens válidas
        const parts: any[] = referenceImages
          .filter((img) => img?.data && img?.mimeType)
          .map((img) => ({
            inline_data: {
              // 🔑 Garante que sempre seja base64 puro
              data: img.data.includes(",") ? img.data.split(",")[1] : img.data,
              mime_type: img.mimeType,
            },
          }));

        // Sempre adiciona o prompt no final (fallback se vazio)
        parts.push({
          text: prompt?.trim() || "Uma arte digital cinematográfica e detalhada",
        });

        // Debug antes da chamada
        console.log("Parts enviados ao modelo:", JSON.stringify(parts, null, 2));

        // Chamada ao modelo Imagen 4.0
        const response = await ai.models.generateContent({
          model: "imagen-4.0-generate-001",
          contents: [{ role: "user", parts }],
          config: {
            response_modalities: ["IMAGE"],
            image_config: {
              aspect_ratio: aspectRatio,
              image_size: imageSize,
              number_of_images: numberOfImages,
              person_generation: personGeneration,
            },
          },
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
          },
        });

        // Debug opcional
        console.log("Imagen response:", JSON.stringify(response, null, 2));
        console.log("Finish reason:", response.candidates?.[0]?.finishReason);

        const images: string[] = [];
        let message: string | undefined;

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inline_data) {
              const base64EncodeString: string = part.inline_data.data || "";
              const mimeType = part.inline_data.mime_type;
              images.push(`data:${mimeType};base64,${base64EncodeString}`);
            } else if (part.text) {
              // Se vier texto em vez de imagem, repassamos como mensagem
              console.log("Modelo retornou texto:", part.text);
              message = part.text;
            }
          }
        }

        if (images.length > 0) {
          return {
            images,
            model: "Imagen 4.0",
          };
        }

        // Retorno amigável para o frontend
        return {
          images: [],
          model: "Imagen 4.0",
          message: message || "A resposta da API não continha uma imagem. Tente ajustar o prompt ou a configuração.",
        };
      });
    },
  };
}
