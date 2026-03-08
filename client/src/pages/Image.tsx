import React, { useState } from "react";
import {
  Image as ImageIcon,
  Download,
  RefreshCw,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getAuthHeader } from "@/lib/auth";
import { withMembershipCheck } from "@/components/ProtectedGenerator";
import { ReferenceImage } from "@/types";
import ReferenceUploader from "@/components/ReferenceUploader";

const IMAGE_COST = 7;

function ImagePageComponent() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">("1:1");
  const [imageSize, setImageSize] = useState<"1K" | "2K">("1K");
  const [numberOfImages, setNumberOfImages] = useState<1 | 2 | 3 | 4>(4);
  const [personGeneration, setPersonGeneration] = useState<"dont_allow" | "allow_adult" | "allow_all">("allow_adult");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [modelMessage, setModelMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt && referenceImages.length === 0) {
      toast({ title: "Digite um prompt ou envie imagens", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          imageSize,
          numberOfImages,
          personGeneration,
          referenceImages
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Erro ao gerar imagem");
      }

      setModelMessage(result.message || null);

      if (Array.isArray(result.images) && result.images.length > 0) {
        setGeneratedImages(result.images);
        toast({ title: "Imagem processada com sucesso!" });
      } else {
        toast({ title: result.message || "Nenhuma imagem gerada.", variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
      toast({ title: errorMessage, variant: "destructive" });
      console.error("Image generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2 mb-8">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
          <span className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
            <ImageIcon className="w-6 h-6" />
          </span>
          Geração de Imagem
        </h1>
        <p className="text-muted-foreground">
          Descreva o que você quer ver ou envie até 3 imagens de referência.
        </p>
      </div>

      <div className="space-y-4">
        {/* Prompt + Aspect ratio + Resolution */}
        <div className="bg-[#0f1117] p-1 rounded-xl border border-[#1f2937] shadow-2xl">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Me conta o que você quer ver — ou descreva a edição que deseja."
            className="min-h-[160px] w-full bg-[#0f1117] border-none resize-none text-lg p-6 focus-visible:ring-0 placeholder:text-muted-foreground/40"
            maxLength={5000}
          />

          <div className="flex flex-col gap-4 px-6 pb-4">
            {/* Aspect Ratio */}
            <div className="flex items-center gap-2">
              {["1:1", "3:4", "4:3", "9:16", "16:9"].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-all border",
                    aspectRatio === ratio
                      ? "bg-[#6366f1] text-white border-[#6366f1]"
                      : "bg-[#1a1d24] text-gray-400 border-[#2d3748] hover:bg-[#2d3748]"
                  )}
                >
                  {ratio}
                </button>
              ))}
            </div>

            {/* Image Size */}
            <div className="flex items-center gap-2">
              {["1K", "2K"].map((size) => (
                <button
                  key={size}
                  onClick={() => setImageSize(size as any)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium transition-all border",
                    imageSize === size
                      ? "bg-[#6366f1] text-white border-[#6366f1]"
                      : "bg-[#1a1d24] text-gray-400 border-[#2d3748] hover:bg-[#2d3748]"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Number of Images */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumberOfImages(num as 1 | 2 | 3 | 4)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium transition-all border",
                    numberOfImages === num
                      ? "bg-[#6366f1] text-white border-[#6366f1]"
                      : "bg-[#1a1d24] text-gray-400 border-[#2d3748] hover:bg-[#2d3748]"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Person Generation */}
            <div className="flex items-center gap-2">
              {[
                { key: "dont_allow", label: "Sem pessoas" },
                { key: "allow_adult", label: "Apenas adultos" },
                { key: "allow_all", label: "Adultos e crianças" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setPersonGeneration(opt.key as any)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium transition-all border",
                    personGeneration === opt.key
                      ? "bg-[#6366f1] text-white border-[#6366f1]"
                      : "bg-[#1a1d24] text-gray-400 border-[#2d3748] hover:bg-[#2d3748]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground font-mono">
              {prompt.length}/5000
            </div>
          </div>
        </div>

        {/* ReferenceUploader */}
        <ReferenceUploader
          images={referenceImages}
          onAdd={(img) => setReferenceImages((prev) => [...prev, img].slice(0, 3))}
          onRemove={(id) => setReferenceImages((prev) => prev.filter((i) => i.id !== id))}
        />

                {/* Action */}
        <Button
          className="w-full bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-bold h-16 rounded-xl text-xl shadow-lg shadow-purple-900/20 transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-3"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin" /> Processando...
            </span>
          ) : (
            <>
              <span className="text-sm font-semibold px-2 py-1 rounded bg-white/20 border border-white/30">
                {IMAGE_COST * numberOfImages} ⚡
              </span>
              <span>Gerar Imagem</span>
            </>
          )}
        </Button>
      </div>

      {/* Mensagem do modelo */}
      {modelMessage && (
        <div className="mt-6 p-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm">
          {modelMessage}
        </div>
      )}

      {/* Gallery + downloads */}
      {generatedImages.length > 0 && (
        <div className="space-y-6 mt-12">
          <div className="grid grid-cols-2 gap-4">
            {generatedImages.map((src, i) => (
              <div
                key={i}
                className="group relative aspect-video rounded-xl overflow-hidden border border-[#2d3748] shadow-xl bg-[#1a1d24] cursor-pointer"
                onClick={() => setFullscreenImage(src)}
                title="Clique para ampliar"
              >
                <img
                  src={src}
                  alt={`Imagem ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {generatedImages.map((src, i) => (
              <a key={i} href={src} download={`imagem-${i}.png`}>
                <Button variant="secondary" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Baixar imagem {i + 1}
                </Button>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Modal fullscreen */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute -top-3 -right-3 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 border border-white/20 transition"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={fullscreenImage}
              alt="Imagem ampliada"
              className="w-full h-auto rounded-xl border border-gray-700 object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default withMembershipCheck(ImagePageComponent);
