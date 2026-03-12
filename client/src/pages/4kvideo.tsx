import { useState, useRef } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader } from "@/lib/auth";
import { withMembershipCheck } from "@/components/ProtectedGenerator";

const VIDEO_COST = 100;

interface ImageData {
  base64: string;
  mimeType: string;
  file: File;
}

function VideoPageComponent() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [creationMode, setCreationMode] = useState<
    "text-to-video" | "image-to-video" | "reference-to-video" | "frame-to-video" | "extend-video"
  >("text-to-video");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageData, setUploadedImageData] = useState<ImageData | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceImagesData, setReferenceImagesData] = useState<ImageData[]>([]);
  const [firstFrame, setFirstFrame] = useState<ImageData | null>(null);
  const [lastFrame, setLastFrame] = useState<ImageData | null>(null);
  const [extendVideoFile, setExtendVideoFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("4k");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (creationMode === "text-to-video" && !prompt.trim()) {
      toast({ title: "Por favor, insira um prompt", variant: "destructive" });
      return;
    }
    if (creationMode === "image-to-video" && !uploadedImage) {
      toast({ title: "Por favor, faça upload de uma imagem", variant: "destructive" });
      return;
    }
    if (creationMode === "reference-to-video" && referenceImages.length === 0) {
      toast({ title: "Por favor, adicione pelo menos uma imagem de referência", variant: "destructive" });
      return;
    }
    if (creationMode === "frame-to-video" && !firstFrame) {
      toast({ title: "Por favor, faça upload do primeiro frame", variant: "destructive" });
      return;
    }
    if (creationMode === "extend-video" && !extendVideoFile) {
      toast({ title: "Por favor, faça upload de um vídeo anterior", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const payload: any = { prompt, mode: creationMode, aspectRatio, resolution };

      if (creationMode === "image-to-video" && uploadedImageData) {
        payload.imageBase64 = uploadedImageData.base64;
        payload.imageMimeType = uploadedImageData.mimeType;
      } else if (creationMode === "reference-to-video" && referenceImagesData.length > 0) {
        payload.referenceImages = referenceImagesData.map((img) => ({
          base64: img.base64,
          mimeType: img.mimeType,
        }));
      } else if (creationMode === "frame-to-video" && firstFrame) {
        payload.firstFrameBase64 = firstFrame.base64;
        payload.firstFrameMimeType = firstFrame.mimeType;
        if (lastFrame) {
          payload.lastFrameBase64 = lastFrame.base64;
          payload.lastFrameMimeType = lastFrame.mimeType;
        }
      } else if (creationMode === "extend-video" && extendVideoFile) {
        payload.extendVideoUri = URL.createObjectURL(extendVideoFile);
      }

      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "insufficient_credits") {
          throw new Error("Créditos insuficientes. Compre mais para continuar.");
        }
        throw new Error(error.error || "Erro ao gerar vídeo");
      }

      const result = await response.json();
      setVideoUrl(result.videoUrl);
      toast({ title: "Vídeo gerado com sucesso!" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao gerar vídeo";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <Card className="lg:col-span-5 border-border/50 shadow-xl bg-[#0f1117] border-[#1f2937] h-fit overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Formato e Resolução */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="w-full bg-[#1a1d24] border-[#2d3748] text-foreground h-12 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-[#2d3748] text-foreground">
                    <SelectItem value="16:9">Panorâmico (16:9)</SelectItem>
                    <SelectItem value="9:16">Rede Social (9:16)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resolução</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="w-full bg-[#1a1d24] border-[#2d3748] text-foreground h-12 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-[#2d3748] text-foreground">
                    <SelectItem value="4k">4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botão Gerar */}
            <Button
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold h-14 rounded-lg text-lg mt-4"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "Gerando..." : `${VIDEO_COST} ⚡ Gerar`}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Cada geração consome {VIDEO_COST} créditos
            </p>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-video rounded-2xl overflow-hidden bg-black border shadow-2xl relative">
            {videoUrl ? (
              <video
                src={videoUrl}
                className="w-full h-full object-cover rounded-lg"
                controls
                autoPlay
                loop
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {isGenerating ? "Criando sua obra-prima..." : "Preview do Vídeo"}
              </div>
            )}
          </div>

                  {/* Download */}
          {videoUrl && (
            <Button
              onClick={() => {
                const link = document.createElement("a");
                link.href = videoUrl;
                link.download = "video.mp4";
                link.click();
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700"
            >
              Download
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default withMembershipCheck(VideoPageComponent);
