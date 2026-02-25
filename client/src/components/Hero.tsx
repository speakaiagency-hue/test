// src/components/Hero.tsx
import React from "react";

const Hero: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto pt-16 pb-12 px-4 flex flex-col items-center relative z-10">
      {/* Headings com Gradient */}
      <h1 className="text-4xl md:text-6xl font-bold text-center mb-4 tracking-tight">
        <span className="text-white">Crie seu próprio </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#a855f7] drop-shadow-lg">
          INFLUENCER
        </span>
      </h1>
      <p className="text-lg text-textMuted text-center mb-12 font-light max-w-xl">
        Aulas curtas, diretas e que cabem no seu dia. Conhecimento sem complicação.
        <br className="hidden md:block" />
      </p>
    </div>
  );
};

export default Hero;
