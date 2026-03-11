import { generateVideo, GenerateVideoParams } from "./GeminiServiceBase";

/**
 * Service específico para geração de vídeos em 1080p
 * - Sempre fixa a resolução em "1080p"
 * - Usa a lógica comum do GeminiServiceBase
 */
export async function generateVideo1080(
  userId: string,
  params: Omit<GenerateVideoParams, "resolution">
) {
  // Força a resolução para 1080p
  const fixedParams: GenerateVideoParams = {
    ...params,
    resolution: "1080p",
  };

  return generateVideo(userId, fixedParams);
}
