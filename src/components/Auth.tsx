import { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn("Login popup was already open or cancelled.");
      } else {
        console.error("Login failed", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-noir-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
        className="max-w-md p-12 relative group"
      >
        <div className="absolute inset-0 border border-white/5 group-hover:border-gold-500/20 transition-colors duration-1000" />
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-gold-500/50" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-gold-500/50" />

        <div className="space-y-10 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 border border-gold-500 flex items-center justify-center font-serif text-gold-500 text-3xl italic shadow-[0_0_30px_rgba(197,160,89,0.15)]">C</div>
              <h1 className="text-6xl font-serif text-white tracking-[0.2em] uppercase">
                Chigga ai
              </h1>
            </div>
            <div className="h-px w-24 bg-gold-500/50 mx-auto mt-2" />
            <p className="text-gold-500/40 font-script text-2xl pt-4">
              Connect and chat
            </p>
          </div>

          <motion.button
            whileHover={!isLoading ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            onClick={login}
            disabled={isLoading}
            className={cn(
              "w-full py-5 px-8 bg-transparent border border-white/10 text-white font-serif italic text-xl transition-all duration-500",
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:border-gold-500/50"
            )}
          >
            {isLoading ? "Connecting..." : "Sign in with Google"}
          </motion.button>

          <p className="text-[10px] uppercase tracking-[0.5em] text-white/10 font-sans">
            Authentication Required
          </p>
        </div>
      </motion.div>
    </div>
  );
}
