import { generateVideo, GenerateVideoParams } from "./GeminiServiceBase";

/**
 * Service específico para geração de vídeos em 720p
 * - Sempre fixa a resolução em "720p"
 * - Usa a lógica comum do GeminiServiceBase
 */
export async function generateVideo720(
  userId: string,
  params: Omit<GenerateVideoParams, "resolution">
) {
  // Força a resolução para 720p
  const fixedParams: GenerateVideoParams = {
    ...params,
    resolution: "720p",
  };

  return generateVideo(userId, fixedParams);
}
