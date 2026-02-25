// src/components/VideoGrid.tsx
import React, { useState } from "react";
import { Play } from "lucide-react";
import VideoPlayerModal from "@/components/VideoPlayerModal";
import { withMembershipCheck } from "@/components/ProtectedGenerator"; // importa o HOC

const VideoGrid: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  const items = [
    {
      id: 1,
      title: "Introdução:",
      description: "Criando sua Influenciadora.",
      thumbnail: "https://imagem.speakia.ai/wp-content/uploads/2026/01/imagem-0-585x1024-1.png",
      videoUrl: "https://imagem.speakia.ai/wp-content/uploads/2026/01/Introducao.mp4",
    },
    {
      id: 2,
      title: "O Poder do Prompt:",
      description: "Guia Passo a Passo.",
      thumbnail: "https://imagem.speakia.ai/wp-content/uploads/2026/01/imagem-0-1-585x1024-1.png",
      videoUrl: "https://imagem.speakia.ai/wp-content/uploads/2026/01/Prompt.mp4",
    },
    {
      id: 3,
      title: "Retrato Realista:",
      description: "Imagem da Personagem.",
      thumbnail: "https://imagem.speakia.ai/wp-content/uploads/2026/01/imagem-0-3.png",
      videoUrl: "https://imagem.speakia.ai/wp-content/uploads/2026/01/Gerar-imagem.mp4",
    },
    {
      id: 4,
      title: "Voz e Movimento:",
      description: "Vídeo Autêntico com IA.",
      thumbnail: "https://imagem.speakia.ai/wp-content/uploads/2026/01/imagem-0-6.png",
      videoUrl: "https://imagem.speakia.ai/wp-content/uploads/2026/01/aula-video-correto.mp4",
    },
    {
      id: 5,
      title: "Conversa Inteligente:",
      description: "Chat com Personalidade.",
      thumbnail: "https://imagem.speakia.ai/wp-content/uploads/2026/01/imagem-0-8.png",
      videoUrl: "https://imagem.speakia.ai/wp-content/uploads/2026/01/0121.mp4",
    },
    {
      id: 6,
      title: "Expansão Global:",
      description: "Tradução e Dublagem.",
      thumbnail: "https://imagem.speakia.ai/wp-content/uploads/2026/01/imagem-0-9.png",
      videoUrl: "https://imagem.speakia.ai/wp-content/uploads/2026/01/Conclusao.mp4",
    },
  ];

  return (
    <div className="w-full max-w-[98%] mx-auto px-2 md:px-4 pb-20 relative z-20">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedVideo({ url: item.videoUrl, title: item.title })}
            className="group relative bg-surface/40 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] cursor-pointer"
          >
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-black/50">
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent z-10 opacity-90" />

              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700"
              />

              <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                  <Play className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-2 md:p-3 z-30">
                <h3 className="text-[11px] md:text-sm font-bold text-white mb-0.5 group-hover:text-primary transition-colors drop-shadow-md leading-tight line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-[9px] md:text-[10px] text-slate-400 leading-tight opacity-90 group-hover:opacity-100 transition-opacity line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/0 group-hover:ring-white/10 transition-all duration-300 pointer-events-none" />
          </div>
        ))}
      </div>

      {selectedVideo && (
        <VideoPlayerModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
        />
      )}
    </div>
  );
};

export default withMembershipCheck(VideoGrid); // protege o componente
