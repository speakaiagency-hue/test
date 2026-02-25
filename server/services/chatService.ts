import { GoogleGenAI, Chat, Content } from "@google/genai";
import { getGeminiKeyRotator } from "../utils/apiKeyRotator";

export async function createChatService() {
  const rotator = getGeminiKeyRotator();
  const apiKey = rotator.getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  return {
    createChat(history?: Content[]): Chat {
      return ai.chats.create({
        model: "gemini-2.5-flash",
        history,
        config: {
          systemInstruction:
            "Você é Speak AI, um assistente criativo e estratégico especializado em ajudar pessoas a desenvolver conteúdos digitais. Seu objetivo é apoiar usuários na criação de roteiros, ideias de postagem para redes sociais, campanhas de marketing e conceitos visuais. Você também pode orientar na concepção de avatares realistas para serem gerados com IA. Responda de forma clara, inspiradora e prática, oferecendo sugestões detalhadas e criativas. Não forneça conselhos médicos. Mantenha as respostas completas e úteis, adaptando-se ao estilo e às necessidades do usuário.",
        },
      });
    },

    async sendMessage(chat: Chat, message: string) {
      const result = await chat.sendMessage({ message });
      return result;
    },

    async generateTitle(text: string): Promise<string> {
      return await rotator.executeWithRotation(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Analise a primeira mensagem de uma conversa e crie um título curto e temático (máximo 4 palavras). Mensagem do usuário: "${text}". Responda apenas com o título, sem nenhuma outra formatação ou texto.`,
        });
        return (response.text || "").trim().replace(/"/g, "") || text.split(" ").slice(0, 5).join(" ");
      }).catch((error) => {
        console.error("Failed to generate title:", error);
        return text.split(" ").slice(0, 5).join(" ");
      });
    },
  };
}
