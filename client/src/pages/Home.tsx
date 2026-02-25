// src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import Showcase from "@/components/Showcase";
import VideoGrid from "@/components/VideoGrid";
import { MOCK_VIDEOS, MOCK_PHOTOS } from "@/constants";

const autoThemes = [
  {
    id: "midnight-depth",
    bg: "bg-black",
    orb1: "bg-purple-900/10",
    orb2: "bg-blue-900/10",
    accent: "bg-slate-800/5",
  },
  {
    id: "nebula-glow",
    bg: "bg-[#1a0b2e]",
    orb1: "bg-fuchsia-600/40",
    orb2: "bg-purple-600/30",
    accent: "bg-pink-500/20",
  },
  {
    id: "ocean-depth",
    bg: "bg-[#020817]",
    orb1: "bg-cyan-900/20",
    orb2: "bg-blue-900/30",
    accent: "bg-indigo-900/10",
  },
];

const Home: React.FC = () => {
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentThemeIndex(
        (prevIndex) => (prevIndex + 1) % autoThemes.length
      );
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const theme = autoThemes[currentThemeIndex];

  return (
    <div
      className={`min-h-screen relative selection:bg-primary/30 selection:text-white transition-colors duration-[3000ms] ease-in-out ${theme.bg}`}
    >
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div
          className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse-slow transition-all duration-[3000ms] ease-in-out ${theme.orb1}`}
        ></div>
        <div
          className={`absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse-slow transition-all duration-[3000ms] ease-in-out ${theme.orb2}`}
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className={`absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[100px] transition-all duration-[3000ms] ease-in-out ${theme.accent}`}
        ></div>
      </div>

      <main className="animate-fade-in relative z-10 pt-8">
        <Hero />

        <VideoGrid />

        <div id="showcase-videos">
          <Showcase
            title="Prompts de Vídeo"
            subtitle="Modelos prontos para você adaptar e usar em qualquer ferramenta de IA"
            projects={MOCK_VIDEOS}
          />
        </div>

        {/* Removida a borda superior */}
        <div id="showcase-photos" className="pt-8">
          <Showcase
            title="Prompts de Foto"
            subtitle="Sugestões práticas para copiar e aplicar em qualquer gerador de imagens."
            projects={MOCK_PHOTOS}
            gradientFrom="#f472b6"
            gradientTo="#ec4899"
          />
        </div>

        <div className="pb-20"></div>
      </main>
    </div>
  );
};

export default Home;
