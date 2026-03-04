import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import { getGeminiKeyRotator } from "../utils/apiKeyRotator";

export interface GenerateVideoParams {
  prompt: string;
  mode: "text-to-video" | "image-to-video" | "reference-to-video" | "frame-to-video" | "extend-video";
  aspectRatio?: "16:9" | "9:16";
  resolution?: "720p" | "1080p" | "4k";
  imageBase64?: string;
  imageMimeType?: string;
  referenceImages?: Array<{ base64: string; mimeType: string }>;
  firstFrameBase64?: string;
  firstFrameMimeType?: string;
  lastFrameBase64?: string;
  lastFrameMimeType?: string;
  extendVideoUri?: string; // vídeo anterior para extensão
}

export async function generateVideo(params: GenerateVideoParams) {
  const rotator = getGeminiKeyRotator();

  return await rotator.executeWithRotation(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });

    // Configuração base
    const config: Record<string, any> = {
      numberOfVideos: 1,
      resolution: params.resolution || "720p",
      aspectRatio: params.aspectRatio || "16:9",
    };

    // Payload inicial
    const generateVideoPayload: Record<string, any> = {
      model: "veo-3.1-generate-preview", // modelo atualizado
      config,
      prompt: params.prompt,
    };

    // Modo imagem → vídeo
    if (params.mode === "image-to-video" && params.imageBase64) {
      generateVideoPayload.image = {
        imageBytes: params.imageBase64,
        mimeType: params.imageMimeType || "image/jpeg",
      };
    }

    // Modo referência → vídeo
    if (params.mode === "reference-to-video" && params.referenceImages?.length) {
      const referenceImagesPayload = params.referenceImages.map((img) => ({
        image: {
          imageBytes: img.base64,
          mimeType: img.mimeType || "image/jpeg",
        },
        referenceType: VideoGenerationReferenceType.ASSET,
      }));

      if (referenceImagesPayload.length > 0) {
        generateVideoPayload.config.referenceImages = referenceImagesPayload;
      }
    }

    // Modo frame-to-video (primeiro e último frame)
    if (params.mode === "frame-to-video" && params.firstFrameBase64) {
      generateVideoPayload.image = {
        imageBytes: params.firstFrameBase64,
        mimeType: params.firstFrameMimeType || "image/jpeg",
      };

      if (params.lastFrameBase64) {
        generateVideoPayload.config.lastFrame = {
          imageBytes: params.lastFrameBase64,
          mimeType: params.lastFrameMimeType || "image/jpeg",
        };
      }
    }

    // Modo extensão de vídeo
    if (params.mode === "extend-video" && params.extendVideoUri) {
      generateVideoPayload.video = { uri: params.extendVideoUri };
    }

    console.log("📤 Submetendo requisição de geração de vídeo...");
    let operation = await ai.models.generateVideos(generateVideoPayload);

    // Polling até terminar
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log("⏳ Gerando vídeo...");
      operation = await ai.operations.getVideosOperation({ operation });
    }

    // Tratamento da resposta
    if (operation?.response) {
      const videos = operation.response.generatedVideos;

      if (!videos || videos.length === 0) {
        const errorMsg =
          operation.error &&
          (typeof operation.error === "string"
            ? operation.error
            : JSON.stringify(operation.error));
        throw new Error(errorMsg || "Nenhum vídeo foi gerado");
      }

      const firstVideo = videos[0];
      if (!firstVideo?.video?.uri) {
        throw new Error("O vídeo gerado não possui URI");
      }

      let uriToParse = firstVideo.video.uri;
      try {
        uriToParse = decodeURIComponent(firstVideo.video.uri);
      } catch {
        console.warn("⚠️ Não foi possível decodificar a URI do vídeo");
      }

      const url = new URL(uriToParse);
      url.searchParams.set("key", apiKey);
      const finalUrl = url.toString();

      return {
        videoUrl: finalUrl,
        uri: finalUrl,
      };
    }

    // Caso erro
    const errorMsg =
      operation.error &&
      (typeof operation.error === "string"
        ? operation.error
        : JSON.stringify(operation.error));
    throw new Error(errorMsg || "Nenhum vídeo foi gerado");
  });
}
