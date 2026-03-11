import { generateVideo, GenerateVideoParams } from "./GeminiServiceBase";

/**
 * Service específico para geração de vídeos em 4K
 * - Sempre fixa a resolução em "4k"
 * - Usa a lógica comum do GeminiServiceBase
 */
export async function generateVideo4k(
  userId: string,
  params: Omit<GenerateVideoParams, "resolution">
) {
  // Força a resolução para 4K
  const fixedParams: GenerateVideoParams = {
    ...params,
    resolution: "4k",
  };

  return generateVideo(userId, fixedParams);
}
