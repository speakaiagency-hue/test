import { generateVideo720 } from "./GeminiService720";
import { generateVideo1080 } from "./GeminiService1080";
import { generateVideo4k } from "./GeminiService4k";
import { GenerateVideoParams } from "./GeminiServiceBase";

type Resolution = "720p" | "1080p" | "4k";

/**
 * Retorna o service correto de acordo com a resolução escolhida
 */
export function getVideoService(resolution: Resolution) {
  switch (resolution) {
    case "720p":
      return generateVideo720;
    case "1080p":
      return generateVideo1080;
    case "4k":
      return generateVideo4k;
    default:
      throw new Error(`Resolução inválida: ${resolution}`);
  }
}

/**
 * Função utilitária para chamar direto sem precisar fazer o switch fora
 */
export async function generateVideoByResolution(
  userId: string,
  params: GenerateVideoParams
) {
  if (!params.resolution) {
    throw new Error("Resolução não informada no payload");
  }

  const generator = getVideoService(params.resolution as Resolution);
  return generator(userId, params);
}
