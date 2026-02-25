// src/components/Showcase.tsx
import React, { useState } from "react";
import { Project } from "@/types";
import { Copy, Check } from "lucide-react";

interface ShowcaseProps {
  projects: Project[];
  title: string;
  subtitle: string;
  gradientFrom?: string;
  gradientTo?: string;
}

const Showcase: React.FC<ShowcaseProps> = ({
  projects,
  title,
  subtitle,
  gradientFrom = "#3b82f6",
  gradientTo = "#a855f7",
}) => {
  // duplicamos os projetos para criar efeito contínuo
  const marqueeProjects = [...projects, ...projects, ...projects];
  const [paused, setPaused] = useState(false);

  return (
    <div className="w-full pb-12 relative z-10 overflow-hidden">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-6 text-center relative z-30">
        <h2 className="text-xl md:text-3xl font-bold text-white mb-2 tracking-tight">
          {title.split(" ").map((word, i, arr) =>
            i === arr.length - 1 ? (
              <span
                key={i}
                style={{
                  color: "transparent",
                  backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                }}
              >
                {" "}
                {word}
              </span>
            ) : (
              <span key={i}> {word}</span>
            )
          )}
        </h2>
        <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto opacity-70">
          {subtitle}
        </p>
      </div>

      {/* Marquee Container */}
      <div className="relative w-full group">
        {/* Gradientes laterais */}
        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-48 bg-gradient-to-r from-background via-background/20 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-48 bg-gradient-to-l from-background via-background/20 to-transparent z-20 pointer-events-none" />

        {/* Carrossel */}
        <div
          className={`flex w-max animate-marquee py-4 ${paused ? "paused-marquee" : ""}`}
          // Mobile: tocar e segurar pausa; soltar retoma
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          onTouchCancel={() => setPaused(false)}
        >
          {marqueeProjects.map((project, index) => (
            <div
              key={`${project.id}-${index}`}
              className="flex-shrink-0 w-[230px] md:w-[260px] mx-3 h-full"
            >
              <FeatureCard project={project} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  project: Project;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ project }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(project.description || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0b1224] border border-slate-800/80 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col h-full select-none group/card">
      {/* Image/Video Area */}
      <div className="aspect-[16/10] w-full overflow-hidden relative bg-black/40">
        {project.videoUrl ? (
          <video
            src={project.videoUrl}
            poster={project.imageUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
          />
        ) : (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
            draggable={false}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1224] via-transparent to-transparent opacity-60 pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col bg-[#0b1224] min-h-[170px] justify-between">
        <div>
          <span className="text-blue-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
            {project.tag}
          </span>

          <h3 className="text-sm md:text-base font-bold text-white mb-1.5 leading-tight line-clamp-1 group-hover/card:text-purple-400 transition-colors">
            {project.title}
          </h3>

          <p className="text-slate-400 text-[10px] md:text-[11px] leading-relaxed mb-4 line-clamp-3 h-[42px] md:h-[48px]">
            {project.description}
          </p>
        </div>

        <div className="mt-auto">
          <div className="mb-3">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 text-[9px] md:text-[10px] font-medium py-1.5 px-3 rounded-lg border transition-all duration-300 w-fit
                ${
                  copied
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copiado!" : "Copiar texto"}
            </button>
          </div>
          <div className="w-8 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-700 group-hover/card:w-full" />
        </div>
      </div>
    </div>
  );
};

export default Showcase;
