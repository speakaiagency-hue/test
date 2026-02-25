import { GoogleGenAI } from "@google/genai";
import { getGeminiKeyRotator } from "../utils/apiKeyRotator";

type GenerateParams = {
  userText?: string | null;
  imageBase64?: string | null;
  mimeType?: string | null;
};

export async function createPromptService() {
  const rotator = getGeminiKeyRotator();

  return {
    // Aceita texto opcional e imagem opcional
    async generateCreativePrompt(params: GenerateParams): Promise<string> {
      const { userText, imageBase64, mimeType } = params;

      return await rotator.executeWithRotation(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });

        // Modelo multimodal (texto + imagem)
        const model = "gemini-2.5-flash";

        // System instruction permanece focada em engenharia de prompt
        const systemInstruction ="Você é um especialista em engenharia de prompts de IA, focado em criar descrições visuais para modelos de geração de imagem de alta qualidade (como Imagen, Midjourney, DALL-E). Seu objetivo é transformar entradas simples do usuário (texto e/ou imagem) em prompts altamente detalhados, artísticos e descritivos. Foque em iluminação, textura, composição, atmosfera, estilo artístico e configurações de câmera. Escreva o resultado final inteiramente em PORTUGUÊS. A saída deve ser um único parágrafo descritivo sem numeração ou marcadores. O texto gerado deve ter no máximo 2.000 caracteres.";

        // Monta os conteúdos multimodais conforme a entrada
        const contents: any[] = [];

        // Instrução principal de usuário conforme disponibilidade
        const hasText = !!userText && userText.trim().length > 0;
        const hasImage = !!imageBase64 && !!mimeType;

        if (hasText && hasImage) {
          contents.push({
            role: "user",
            parts: [
              { text: `Use esta imagem como referência principal e expanda o texto do usuário em um prompt completo de geração de imagem. Texto do usuário: "${userText}".` },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64!,
                },
              },
            ],
          });
        } else if (hasImage) {
          contents.push({
            role: "user",
            parts: [
              { text: "Analise esta imagem e gere um prompt descritivo completo, em português, fiel ao conteúdo visual." },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64!,
                },
              },
            ],
          });
        } else if (hasText) {
          contents.push({
            role: "user",
            parts: [
              { text: `Melhore e expanda esta descrição para um prompt completo de geração de imagem: "${userText}". Garanta riqueza de detalhes visuais e mantenha em português.` },
            ],
          });
        } else {
          // Caso nenhuma entrada seja fornecida, gera um prompt genérico (opcional)
          contents.push({
            role: "user",
            parts: [
              { text: "Crie um prompt artístico e descritivo em português para geração de imagem, sem referência específica, focando em iluminação, textura, composição, atmosfera, estilo e câmera." },
            ],
          });
        }

        const response = await ai.models.generateContent({
          model,
          config: { systemInstruction },
          contents,
        });

        const text = response?.text?.trim();
        return text && text.length > 0
          ? text
          : "Não foi possível gerar o prompt.";
      });
    },
  };
}
