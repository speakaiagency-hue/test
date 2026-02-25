import { useState, useRef } from "react";
import { Video, Film, Upload, ArrowRight, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader } from "@/lib/auth";
import { withMembershipCheck } from "@/components/ProtectedGenerator";

const VIDEO_COST = 40;

interface ImageData {
  base64: string;
  mimeType: string;
  file: File;
}

function VideoPageComponent() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [creationMode, setCreationMode] = useState<"text-to-video" | "image-to-video" | "reference-to-video">("text-to-video");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageData, setUploadedImageData] = useState<ImageData | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceImagesData, setReferenceImagesData] = useState<ImageData[]>([]);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        const url = URL.createObjectURL(file);
        setUploadedImage(url);
        setUploadedImageData({ base64, mimeType: file.type, file });
        toast({ title: "Arquivo carregado com sucesso!" });
      } catch (error) {
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
      } catch (error) {
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><Video className="w-6 h-6" /></span>
            Geração de Vídeo
          </h1>
          <p className="text-muted-foreground">Crie vídeos cinematográficos a partir de texto ou imagens.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <Card className="lg:col-span-5 border-border/50 shadow-xl bg-[#0f1117] border-[#1f2937] h-fit overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Modo de Criação */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Modo de Criação</Label>
              <Select
                value={creationMode}
                onValueChange={(val: "text-to-video" | "image-to-video" | "reference-to-video") => {
                  setCreationMode(val);
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
                </SelectContent>
              </Select>
                       </div>

            {/* Área de entrada baseada no modo */}
            <div className="space-y-4">
              {/* Prompt primeiro */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {creationMode === "text-to-video"
                    ? "Prompt"
                    : creationMode === "image-to-video"
                    ? "Descreva o que deve acontecer no vídeo"
                    : "Descreva o vídeo baseado nas referências"}
                </Label>
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    creationMode === "text-to-video"
                      ? "Descreva o vídeo que você quer criar..."
                      : creationMode === "image-to-video"
                      ? "Ex: A pessoa começa a sorrir e acenar..."
                      : "Ex: Um vídeo no estilo das referências, com movimento suave..."
                  }
                  className="h-32 resize-none bg-[#1a1d24] border-[#2d3748] text-foreground rounded-lg focus:ring-indigo-500/50 placeholder:text-muted-foreground/50 p-4"
                />
              </div>

              {/* Upload para image-to-video */}
              {creationMode === "image-to-video" && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Upload da Imagem</Label>
                  <div className="border-2 border-dashed border-[#2d3748] rounded-lg p-6 hover:bg-[#1a1d24] transition-colors relative group cursor-pointer text-center bg-[#1a1d24]/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {uploadedImage ? (
                      <div className="relative w-full aspect-video rounded-md overflow-hidden">
                        <img src={uploadedImage} alt="Upload" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Trocar</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <div className="w-12 h-12 rounded-full bg-[#2d3748] flex items-center justify-center">
                          <Upload className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-300">Clique para fazer upload</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Referências para reference-to-video */}
              {creationMode === "reference-to-video" && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Upload de Referências (Max 3)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {referenceImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[#2d3748] group">
                        <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeReference(idx)}
                          className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {referenceImages.length < 3 && (
                      <div className="aspect-square border-2 border-dashed border-[#2d3748] rounded-lg hover:bg-[#1a1d24] transition-colors relative cursor-pointer flex flex-col items-center justify-center gap-2 group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReferenceUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-8 h-8 rounded-full bg-[#2d3748] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium uppercase">Adicionar</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Formato e Resolução */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Formato</Label>
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
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resolução</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="w-full bg-[#1a1d24] border-[#2d3748] text-foreground h-12 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-[#2d3748] text-foreground">
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botão Gerar */}
            <Button
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold shadow-lg shadow-indigo-500/20 h-14 rounded-lg text-lg mt-4 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gerando...
                </span>
              ) : (
                <>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-white/20 border border-white/30">{VIDEO_COST} ⚡</span>
                  <span className="flex items-center gap-2">
                    Gerar <ArrowRight className="w-5 h-5" />
                  </span>
                </>
              )}
            </Button>
                   </CardContent>
        </Card>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-border/50 shadow-2xl relative group ring-1 ring-white/10">
            {videoUrl ? (
              <video
                src={videoUrl}
                className="w-full h-full object-cover rounded-lg"
                controls
                autoPlay
                loop
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-[#0f1117] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1f2937] to-[#0f1117]">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full animate-spin" />
                      <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <Film className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 animate-pulse" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-lg font-medium text-foreground animate-pulse">Criando sua obra-prima...</p>
                      <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 p-6">
                    <div className="w-24 h-24 rounded-full bg-[#1f2937] flex items-center justify-center mx-auto mb-2 border border-white/5">
                      <Film className="w-10 h-10 opacity-30 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xl font-medium text-foreground">Preview do Vídeo</p>
                      <p className="text-sm opacity-60 max-w-md mx-auto mt-2">
                        Configure os parâmetros ao lado e clique em "Gerar" para visualizar o resultado.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Download abaixo do vídeo */}
          {videoUrl && (
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = videoUrl;
                  link.download = "video.mp4";
                  link.click();
                }}
                className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold shadow-md hover:bg-indigo-700"
              >
                Download
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withMembershipCheck(VideoPageComponent);
