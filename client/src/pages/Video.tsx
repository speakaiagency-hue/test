import { useState, useRef } from "react";
import { Video, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader } from "@/lib/auth";
import { withMembershipCheck } from "@/components/ProtectedGenerator";

const VIDEO_COSTS: Record<string, number> = {
  "720p": 20,
  "1080p": 40,
  "4k": 100,
};

const getVideoCost = (resolution: string) => {
  return VIDEO_COSTS[resolution] || 40;
};

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
  const [resolution, setResolution] = useState("720p");
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        const url = URL.createObjectURL(file);
        setUploadedImage(url);
        setUploadedImageData({ base64, mimeType: file.type, file });
        toast({ title: "Arquivo carregado com sucesso!" });
      } catch {
        toast({ title: "Erro ao carregar arquivo", variant: "destructive" });
      }
    }
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (referenceImages.length >= 3) {
        toast({ title: "Máximo de 3 imagens permitidas", variant: "destructive" });
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        const url = URL.createObjectURL(file);
        setReferenceImages([...referenceImages, url]);
        setReferenceImagesData([...referenceImagesData, { base64, mimeType: file.type, file }]);
        toast({ title: "Referência adicionada!" });
      } catch {
        toast({ title: "Erro ao carregar arquivo", variant: "destructive" });
      }
    }
  };

  const removeReference = (index: number) => {
    const newImages = [...referenceImages];
    newImages.splice(index, 1);
    setReferenceImages(newImages);
    const newData = [...referenceImagesData];
    newData.splice(index, 1);
    setReferenceImagesData(newData);
  };

  const handleFirstFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setFirstFrame({ base64, mimeType: file.type, file });
      toast({ title: "Primeiro frame carregado!" });
    }
  };

  const handleLastFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setLastFrame({ base64, mimeType: file.type, file });
      toast({ title: "Último frame carregado!" });
    }
  };

  const handleExtendVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExtendVideoFile(file);
      toast({ title: "Vídeo anterior carregado!" });
    }
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
      const payload: any = {
        prompt,
        mode: creationMode,
        aspectRatio,
        resolution,
      };

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
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Video className="w-6 h-6" />
            </span>
            Geração de Vídeo
          </h1>
                  <p className="text-muted-foreground">
            Crie vídeos cinematográficos a partir de texto ou imagens.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <Card className="lg:col-span-5 border-border/50 shadow-xl bg-[#0f1117] border-[#1f2937] h-fit overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Modo de Criação */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Modo de Criação
              </Label>
              <Select
                value={creationMode}
                onValueChange={(val) => {
                  setCreationMode(val as any);
                  setUploadedImage(null);
                  setReferenceImages([]);
                }}
              >
                <SelectTrigger className="w-full bg-[#1a1d24] border-[#2d3748] text-foreground h-12 rounded-lg focus:ring-indigo-500/50">
                  <SelectValue placeholder="Selecione o modo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-[#2d3748] text-foreground">
                  <SelectItem value="text-to-video">Texto para Vídeo</SelectItem>
                  <SelectItem value="image-to-video">Imagem para Vídeo</SelectItem>
                  <SelectItem value="reference-to-video">Referências para Vídeo</SelectItem>
                  <SelectItem value="frame-to-video">Frames para Vídeo</SelectItem>
                  <SelectItem value="extend-video">Extensão de Vídeo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {creationMode === "text-to-video"
                  ? "Prompt"
                  : creationMode === "image-to-video"
                  ? "Descreva o que deve acontecer no vídeo"
                  : creationMode === "reference-to-video"
                  ? "Descreva o vídeo baseado nas referências"
                  : creationMode === "frame-to-video"
                  ? "Descreva o vídeo entre os frames"
                  : "Descreva como o vídeo deve continuar"}
              </Label>
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva o vídeo que você quer criar..."
                className="h-32 resize-none bg-[#1a1d24] border-[#2d3748] text-foreground rounded-lg focus:ring-indigo-500/50 placeholder:text-muted-foreground/50 p-4"
              />
            </div>

           {/* Uploads condicionais */}
{creationMode === "text-to-video" && (
  <div className="space-y-2">
    <Label>Pré-visualização Institucional</Label>
    <video
      src="https://imagem.speakia.ai/wp-content/uploads/2026/01/Video-3.mp4"
      controls
      autoPlay
      className="w-full rounded-md"
    />
    <p className="text-gray-300 text-sm mt-2">
      Este vídeo institucional aparece como preview antes da geração.
    </p>
  </div>
)}

{creationMode === "image-to-video" && (
  <div className="space-y-2">
    <Label>Upload da Imagem</Label>
    <div
      className="border-2 border-dashed border-gray-500 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800 transition"
      onClick={() => document.getElementById("imageUpload")?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
          const fakeEvent = { target: { files: [file] } } as React.ChangeEvent<HTMLInputElement>;
          handleImageUpload(fakeEvent);
        }
      }}
    >
      {uploadedImage ? (
        <img src={uploadedImage} alt="Preview" className="mx-auto max-h-48 rounded-md" />
      ) : (
        <div className="flex flex-col items-center">
          <Upload className="w-8 h-8 mb-2 text-gray-400" />
          <p className="text-gray-300">Arraste sua imagem aqui ou clique para selecionar</p>
        </div>
      )}
    </div>
    <input
      id="imageUpload"
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      className="hidden"
    />
  </div>
)}

{creationMode === "reference-to-video" && (
  <div className="space-y-2">
    <Label>Upload de Referências (Max 3)</Label>
    <div
      className="border-2 border-dashed border-gray-500 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800 transition"
      onClick={() => document.getElementById("referenceUpload")?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
          const fakeEvent = { target: { files: [file] } } as React.ChangeEvent<HTMLInputElement>;
          handleReferenceUpload(fakeEvent);
        }
      }}
    >
      <Upload className="w-8 h-8 mb-2 text-gray-400" />
      <p className="text-gray-300">Arraste até 3 imagens ou clique</p>
    </div>
    <input
      id="referenceUpload"
      type="file"
      accept="image/*"
      onChange={handleReferenceUpload}
      className="hidden"
    />
    <div className="flex gap-4 mt-2">
      {referenceImages.map((img, idx) => (
        <div key={idx} className="relative">
          <img src={img} alt={`Ref ${idx}`} className="h-24 rounded-md" />
          <button
            onClick={() => removeReference(idx)}
            className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-1 text-xs"
          >
            X
          </button>
        </div>
      ))}
    </div>
  </div>
)}

{creationMode === "frame-to-video" && (
  <div className="space-y-2">
    <Label>Upload do Primeiro Frame</Label>
    <div
      className="border-2 border-dashed border-gray-500 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800 transition"
      onClick={() => document.getElementById("firstFrameUpload")?.click()}
    >
      <Upload className="w-8 h-8 mb-2 text-gray-400" />
      <p className="text-gray-300">Clique ou arraste o primeiro frame</p>
    </div>
    <input
      id="firstFrameUpload"
      type="file"
      accept="image/*"
      onChange={handleFirstFrameUpload}
      className="hidden"
    />

    <Label>Upload do Último Frame (opcional)</Label>
    <div
      className="border-2 border-dashed border-gray-500 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800 transition"
      onClick={() => document.getElementById("lastFrameUpload")?.click()}
    >
      <Upload className="w-8 h-8 mb-2 text-gray-400" />
      <p className="text-gray-300">Clique ou arraste o último frame</p>
    </div>
    <input
      id="lastFrameUpload"
      type="file"
      accept="image/*"
      onChange={handleLastFrameUpload}
      className="hidden"
    />
  </div>
)}

{creationMode === "extend-video" && (
  <div className="space-y-2">
    <Label>Upload do Vídeo Anterior</Label>
    <div
      className="border-2 border-dashed border-gray-500 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800 transition"
      onClick={() => document.getElementById("extendVideoUpload")?.click()}
    >
      <Upload className="w-8 h-8 mb-2 text-gray-400" />
      <p className="text-gray-300">Clique ou arraste o vídeo</p>
    </div>
    <input
      id="extendVideoUpload"
      type="file"
      accept="video/*"
      onChange={handleExtendVideoUpload}
      className="hidden"
    />
  </div>
)}

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
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
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
              {isGenerating ? "Gerando..." : `${getVideoCost(resolution)} ⚡ Gerar`}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-video rounded-2xl overflow-hidden bg-black border shadow-2xl relative">
            {videoUrl ? (
              <video src={videoUrl} className="w-full h-full object-cover rounded-lg" controls autoPlay loop />
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
