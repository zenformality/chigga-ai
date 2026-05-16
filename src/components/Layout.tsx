import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-noir-950 text-white selection:bg-white/10 overflow-hidden relative">
      {/* Background elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-150 contrast-150" />
        
        {/* Subtle spotlight */}
        <div className="absolute top-0 left-1/4 w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[140px] mix-blend-soft-light" />
        <div className="absolute -bottom-20 -right-20 w-[40%] h-[40%] bg-white/[0.01] rounded-full blur-[120px]" />
        
        {/* Subtly moving scanning line */}
        <motion.div 
          animate={{ y: ["0%", "100%", "0%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.03] to-transparent z-50 pointer-events-none"
        />
      </div>

      <div className="relative z-10 flex h-screen">
        {children}
      </div>
    </div>
  );
}
