import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import { getGeminiKeyRotator } from "../utils/apiKeyRotator";
import { deductCredits } from "./WebhookService";
import { storage } from "../storage";

export interface GenerateVideoParams {
  prompt: string;
  mode: "text-to-video" | "image-to-video" | "reference-to-video" | "frame-to-video" | "extend-video";
  aspectRatio?: "16:9" | "9:16";
  resolution?: "4k"; // ✅ apenas 4K
  imageBase64?: string;
  imageMimeType?: string;
  referenceImages?: Array<{ base64: string; mimeType: string }>;
  firstFrameBase64?: string;
  firstFrameMimeType?: string;
  lastFrameBase64?: string;
  lastFrameMimeType?: string;
  extendVideoUri?: string;
}

export async function generateVideo(userId: string, params: GenerateVideoParams) {
  // 🔎 Deduz créditos conforme resolução (fixo 4K)
  const creditResult = await deductCredits(userId, "video", { resolution: "4k" });

  if (!creditResult.success) {
    return {
      success: false,
      error: creditResult.error,
      message: creditResult.message,
    };
  }

  const rotator = getGeminiKeyRotator();

  return await rotator.executeWithRotation(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });

    const config: Record<string, any> = {
      numberOfVideos: 1,
      resolution: "4k", // ✅ sempre 4K
      aspectRatio: params.aspectRatio || "16:9",
      durationSeconds: 10, // ✅ duração fixa para 4K
    };

    const generateVideoPayload: Record<string, any> = {
      model: "veo-3.1-generate-preview",
      config,
      prompt: params.prompt,
    };

    if (params.mode === "image-to-video" && params.imageBase64) {
      generateVideoPayload.image = {
        imageBytes: params.imageBase64,
        mimeType: params.imageMimeType || "image/jpeg",
      };
    }

    if (params.mode === "reference-to-video" && params.referenceImages?.length) {
      const referenceImagesPayload = params.referenceImages.slice(0, 3).map((img) => ({
        image: {
          imageBytes: img.base64,
          mimeType: img.mimeType || "image/jpeg",
        },
        referenceType: VideoGenerationReferenceType.ASSET,
      }));
      generateVideoPayload.config.referenceImages = referenceImagesPayload;
    }

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

    if (params.mode === "extend-video" && params.extendVideoUri) {
      generateVideoPayload.video = { uri: params.extendVideoUri };
      generateVideoPayload.config.resolution = "4k"; // ✅ extensão também em 4K
      generateVideoPayload.config.durationSeconds = 10;
    }

    console.log("📤 Submetendo requisição de geração de vídeo...");
    let operation = await ai.models.generateVideos(generateVideoPayload);

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log("⏳ Gerando vídeo...");
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (operation?.response) {
      const videos = operation.response.generatedVideos;
      if (!videos || videos.length === 0) {
        throw new Error(operation.error ? JSON.stringify(operation.error) : "Nenhum vídeo foi gerado");
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

      // 🔎 Logar evento corretamente
      await storage.logVideoGeneration(userId, params, { url: finalUrl });

      return {
        success: true,
        videoUrl: finalUrl,
        creditsRemaining: creditResult.creditsRemaining,
        cost: creditResult.cost,
      };
    }

    throw new Error(operation.error ? JSON.stringify(operation.error) : "Nenhum vídeo foi gerado");
  });
}
