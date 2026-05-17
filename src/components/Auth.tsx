import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, ArrowLeft } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { cn } from '../lib/utils';

type ViewState = 'login' | 'policy' | 'credits';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<ViewState>('login');

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
    <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-noir-950 overflow-y-auto">
      <AnimatePresence mode="wait">
        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="max-w-md w-full p-12 relative group"
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

              <div className="space-y-4">
                <p className="text-[10px] text-white/40 font-sans px-4">
                  By signing in, you accept our platform policies. You are strictly responsible for any content you generate and actions you take. Logging in also grants us access to your email address for account purposes.
                </p>
                <div className="flex justify-center gap-4 text-[10px] uppercase tracking-[0.2em] font-sans">
                  <button onClick={() => setView('policy')} className="text-white/30 hover:text-gold-500 transition-colors">Policies</button>
                  <span className="text-white/10">|</span>
                  <button onClick={() => setView('credits')} className="text-white/30 hover:text-gold-500 transition-colors">Credits</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'policy' && (
          <motion.div
            key="policy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl w-full p-8 md:p-12 relative text-left"
          >
            <div className="absolute inset-0 border border-white/5" />
            <button 
              onClick={() => setView('login')}
              className="relative z-10 flex items-center gap-2 text-gold-500/50 hover:text-gold-500 uppercase tracking-widest text-[10px] mb-8 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl font-serif italic text-white tracking-widest uppercase border-b border-white/10 pb-4">Platform Policies</h2>
              
              <div className="space-y-6 text-sm text-white/60 font-sans leading-relaxed">
                <div>
                  <h3 className="text-white font-serif italic text-xl mb-2">1. User Responsibility</h3>
                  <p>You are strictly responsible for any content you generate, transmit, or interact with on this platform. The AI models provide outputs based on your inputs, and you retain all responsibility for how that information is used or shared.</p>
                </div>
                
                <div>
                  <h3 className="text-white font-serif italic text-xl mb-2">2. Data & Privacy</h3>
                  <p>By logging in, you grant us access to your email address for account identification and authentication purposes only. We do not sell your personal data. Chat sessions are stored to provide a continuous experience.</p>
                </div>
                
                <div>
                  <h3 className="text-white font-serif italic text-xl mb-2">3. Acceptable Use</h3>
                  <p>In unrestricted mode, the platform permits explicit language and mature themes. However, engaging in activities that violate legal statutes, promote non-consensual harm, or threaten platform security is strictly prohibited.</p>
                </div>

                <div>
                  <h3 className="text-white font-serif italic text-xl mb-2">4. Disclaimer of Liability</h3>
                  <p>The service is provided "as is". We are not liable for any damages, psychological or material, arising from the use of the platform. The AI-generated characters do not possess real consciousness or intent.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'credits' && (
          <motion.div
            key="credits"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl w-full p-8 md:p-12 relative text-center flex flex-col items-center justify-center min-h-[400px]"
          >
            <div className="absolute inset-0 border border-white/5" />
            <div className="absolute top-8 left-8">
              <button 
                onClick={() => setView('login')}
                className="relative z-10 flex items-center gap-2 text-gold-500/50 hover:text-gold-500 uppercase tracking-widest text-[10px] transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 border border-gold-500/20 flex items-center justify-center font-serif text-gold-500 text-3xl italic mx-auto mb-8">C</div>
              <h2 className="text-4xl font-serif italic text-white tracking-widest uppercase">Credits</h2>
              
              <div className="pt-8 border-t border-white/10 mt-8">
                <p className="text-white/40 uppercase tracking-[0.3em] text-sm leading-loose">
                  Made with sorrow by<br/>
                  <a 
                    href="https://github.com/zenformality" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gold-500 hover:text-gold-400 border-b border-gold-500/30 hover:border-gold-500 transition-all font-serif italic text-xl normal-case tracking-wider px-2"
                  >
                    zen
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
