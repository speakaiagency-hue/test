// Tipagem de proporções padronizada
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

// Imagem de referência usada como input para geração
export interface ReferenceImage {
  id: string;
  data: string;      // base64 puro (sem prefixo data:image/png;base64,...)
  mimeType: string;  // tipo MIME (ex: "image/png")
  preview: string;   // usado para exibir no front (dataURL completo)
}

// Imagem gerada pela IA
export interface GeneratedImage {
  id: string;
  url: string;             // base64 data URL (ex: data:image/png;base64,...)
  prompt: string;          // prompt usado na geração
  aspectRatio: AspectRatio; // proporção tipada corretamente
  timestamp: number;       // marca temporal da geração
  width?: number;          // largura opcional
  height?: number;         // altura opcional
}

// Configuração de geração
export interface GenerationConfig {
  prompt: string;
  negativePrompt?: string;   // prompt negativo opcional
  aspectRatio: AspectRatio;
  numberOfImages: number;    // quantas imagens gerar
}

// Metadados de projeto
export interface Project {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  messagesCount?: number;
  isGenerated?: boolean;
  description?: string;
  tag?: string;
}

// Views possíveis da aplicação
export type AppView = "home";
