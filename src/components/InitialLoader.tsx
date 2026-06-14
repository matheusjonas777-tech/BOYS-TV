import { motion } from "motion/react";
import { Zap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function InitialLoader() {
  const [stage, setStage] = useState(0);

  const stages = [
    "Carregando configurações de domínio...",
    "Sincronizando infraestrutura de banco de dados real-time...",
    "Aquecendo servidores e CDN de alta largura...",
    "Carregando catálogo completo e reprodução segura...",
    "Pronto para transmissão..."
  ];

  useEffect(() => {
    const intervals = [800, 1500, 2200, 2900, 3500];
    const timers = intervals.map((time, idx) => 
      setTimeout(() => setStage(idx + 1), time)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050505] z-[9999] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden h-screen w-screen">
      {/* Background ambient decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#E50914]/15 rounded-full filter blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-[250px] h-[250px] bg-[#E50914]/5 rounded-full filter blur-[90px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-red-600/5 rounded-full filter blur-[90px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Pulsating logo icon */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="w-16 h-16 bg-[#E50914]/10 rounded-2xl flex items-center justify-center border border-[#E50914]/30 shadow-[0_0_40px_rgba(229,9,20,0.15)] relative">
            <Zap className="text-[#E50914] fill-[#E50914] animate-pulse" size={28} />
            <span className="absolute -inset-0.5 rounded-2xl bg-[#E50914]/20 blur opacity-30 animate-pulse" />
          </div>
        </motion.div>

        {/* Dynamic platform typography */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl md:text-3xl font-black tracking-tighter uppercase mb-2 text-white flex items-center justify-center gap-2"
        >
          BOYS LOVE ZERO TV
          <span className="bg-[#E50914] text-white text-[8px] md:text-[9px] font-black tracking-wider px-2 py-0.5 rounded-sm uppercase align-middle">
            COMPLETA
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.4 }}
          className="text-[9px] font-black uppercase text-gray-400 tracking-[4px] mb-12"
        >
          Streaming Gratuito & Ilimitado
        </motion.p>

        {/* Professional Custom loading spinner container */}
        <div className="relative mb-8 w-20 h-20 flex items-center justify-center">
          {/* Track Circle */}
          <div className="absolute w-12 h-12 rounded-full border-2 border-white/5" />
          {/* Spinning progress segment */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="absolute w-12 h-12 rounded-full border-2 border-[#E50914] border-t-transparent border-r-transparent"
          />
          {/* Subtle slow secondary rotation ring for visual depth */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            className="absolute w-16 h-16 rounded-full border border-dashed border-[#E50914]/20"
          />
          <Loader2 className="animate-spin text-[#E50914]/40 absolute" size={18} />
        </div>

        {/* Informative stage messages */}
        <div className="h-6">
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono line-clamp-1"
          >
            {stages[Math.min(stage, stages.length - 1)]}
          </motion.p>
        </div>

        {/* Progress bar container */}
        <div className="w-48 bg-white/5 h-1 rounded-full overflow-hidden mt-6 relative border border-white/5">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(((stage + 1) / stages.length) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.5)]"
          />
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0">
        <p className="text-[7px] text-gray-600 font-bold tracking-[2px] uppercase">
          PROVEDOR DE CONDIÇÃO REDUNDANTE DE REDE • FAMÍLIA GIANI
        </p>
      </div>
    </div>
  );
}
