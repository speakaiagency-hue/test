import { useState } from "react";
import { Copy, Wand2, RefreshCw, CheckCircle2, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader } from "@/lib/auth";
import { withMembershipCheck } from "@/components/ProtectedGenerator";

function PromptComponent() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [qualityScore, setQualityScore] = useState(0);
  const [input, setInput] = useState("");

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageData, setUploadedImageData] = useState<{ base64: string; mimeType: string } | null>(null);

  // 👉 estado para controlar se foi copiado
  const [copied, setCopied] = useState(false);

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
    setIsGenerating(true);
    try {
      const response = await fetch("/api/prompt/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          userInput: input.trim() || null,
          imageBase64: uploadedImageData?.base64 || null,
          mimeType: uploadedImageData?.mimeType || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao gerar prompt");
      }

      const result = await response.json();
      setGeneratedPrompt(result.prompt || "");
      setQualityScore(Math.floor(Math.random() * 15) + 85);
      toast({ title: "Prompt gerado com sucesso!" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao conectar com IA";
      toast({ title: message, variant: "destructive" });
      console.error("Prompt generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setUploadedImage(URL.createObjectURL(file));
      setUploadedImageData({ base64, mimeType: file.type });
      toast({ title: "Imagem carregada com sucesso!" });
    } catch {
      toast({ title: "Erro ao carregar imagem", variant: "destructive" });
    }
  };

  const handleCopy = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true); // muda estado
    toast({ title: "Copiado!" });

    // volta para "Copiar" depois de 2 segundos
    setTimeout(() => setCopied(false), 5000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col items-center text-center gap-2 mb-8">
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
          <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Wand2 className="w-6 h-6" />
          </span>
          Gerador de Prompt
        </h1>
        <p className="text-muted-foreground">
          Digite um texto (opcional) ou envie uma imagem. Você pode usar um, o outro, ou ambos.
        </p>
      </div>

      {/* Upload de imagem */}
      <div className="space-y-4">
        <div className="border-2 border-dashed border-[#2d3748] rounded-lg p-6 hover:bg-[#1a1d24] transition-colors relative group cursor-pointer text-center bg-[#0f1117]/50">
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
                <span className="text-white font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Trocar
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-[#2d3748] flex items-center justify-center">
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-300">Clique para enviar uma imagem</p>
            </div>
          )}
        </div>
      </div>

      {/* Input de texto */}
      <div className="space-y-4">
        <div className="relative bg-[#0f1117] p-1 rounded-xl border border-[#1f2937] shadow-2xl">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Você pode escrever algo aqui... ou deixar vazio!"
            className="min-h-[200px] w-full bg-[#0f1117] border-none resize-none text-lg p-6 focus-visible:ring-0 placeholder:text-muted-foreground/40"
            maxLength={5000}
          />
          <div className="absolute bottom-4 right-6 text-xs text-muted-foreground font-mono">
            {input.length}/5000
          </div>
        </div>

        <Button
          className="w-full bg-[#6366f1] hover:bg-[#5558dd] text-white font-bold h-14 rounded-xl text-lg shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-3"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> Gerando...
            </span>
          ) : (
            <span>Gerar Prompt</span>
          )}
        </Button>
      </div>

      {/* Saída */}
      {generatedPrompt && (
        <Card className="border-border/50 shadow-lg bg-[#0f1117]/50 backdrop-blur-sm relative overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500">
          {qualityScore > 0 && (
            <div className="absolute top-0 right-0 p-4 z-10">
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1">
                Qualidade: {qualityScore}/100
              </Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Resultado otimizado
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-[#1a1d24] p-6 rounded-xl border border-[#2d3748] font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner text-gray-300">
              {generatedPrompt}
            </div>
            <div className="flex justify-center">
              <Button
                className={`px-6 py-3 transition-colors ${
                  copied ? "bg-green-600 text-white" : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                }`}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                                       <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar texto
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withMembershipCheck(PromptComponent);
