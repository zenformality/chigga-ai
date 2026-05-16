import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Trash2, Send, BrainCircuit, Shield, ShieldOff } from 'lucide-react';
import { Character, Message, UserSettings } from '../types';
import { generateGeminiResponse, generateGreeting } from '../lib/gemini';
import { generateHFResponse } from '../lib/huggingface';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface ChatWindowProps {
  character: Character;
  messages: Message[];
  onSendMessage: (content: string, role: 'user' | 'assistant') => void;
  onClearChat: () => void;
  onMenuToggle?: () => void;
  settings: UserSettings;
}

export default function ChatWindow({ character, messages, onSendMessage, onClearChat, onMenuToggle, settings }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const getGreeting = async () => {
      // If we already have messages, don't greet
      if (messages.length > 0 || isTyping) return;

      // 1. If the character has a pre-defined greeting, use it immediately
      if (character.greeting) {
        onSendMessage(character.greeting, 'assistant');
        return;
      }

      // 2. Only generate AI greeting for server-based bots (isCustom is false)
      if (!character.isCustom) {
        setIsTyping(true);
        try {
          const model = settings.isNsfw ? 'nsfw' : 'sfw-gemini';
          const greeting = await generateGreeting(character.systemPrompt, model, settings.displayName);
          onSendMessage(greeting, 'assistant');
        } catch (error) {
          console.error("Greeting failed:", error);
        } finally {
          setIsTyping(false);
        }
      }
    };

    getGreeting();
  }, [character.id, settings.isNsfw]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    onSendMessage(userMessage, 'user');
    
    setIsTyping(true);
    try {
      let aiResponse = '';

      if (settings.isNsfw) {
        aiResponse = await generateHFResponse(userMessage, character.systemPrompt, true, settings.displayName);
      } else {
        aiResponse = await generateGeminiResponse(userMessage, character.systemPrompt, messages.map(m => ({ 
          role: m.role, 
          text: m.content 
        })), settings.displayName);
      }

      onSendMessage(aiResponse, 'assistant');
    } catch (error) {
      console.error(error);
      onSendMessage("Connection error. The character could not respond.", 'assistant');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-noir-950">
      {/* Character Header */}
      <header className="p-5 md:p-8 border-b border-white/5 bg-noir-950/80 backdrop-blur-2xl flex items-center justify-between z-20">
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={onMenuToggle}
            className="p-2 -ml-2 text-white/40 hover:text-gold-400 md:hidden transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="relative">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/10 shadow-2xl">
              <img src={character.avatar} alt={character.name} className="w-full h-full object-cover grayscale-[0.1]" />
            </div>
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-gold-500 border-2 border-noir-950 shadow-[0_0_10px_rgba(197,160,89,0.5)]" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-serif text-white tracking-wide">{character.name}</h2>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gold-500/50" />
              <span className="text-[9px] md:text-[11px] font-script text-gold-500/60 lowercase italic">Connected</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/5">
            {settings.isNsfw ? (
              <>
                <ShieldOff size={10} className="text-red-500/50" />
                <span className="text-[10px] uppercase tracking-widest text-red-500/40">Explicit</span>
              </>
            ) : (
              <>
                <Shield size={10} className="text-gold-500/50" />
                <span className="text-[10px] uppercase tracking-widest text-gold-500/40">Filtered</span>
              </>
            )}
          </div>

          <button
            onClick={onClearChat}
            className="p-2 text-white/10 hover:text-gold-500/50 transition-all"
            title="Clear Chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-12 space-y-12 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-10"
            >
              <div className="w-16 h-16 rounded-full border border-dashed border-white flex items-center justify-center">
                <BrainCircuit size={24} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] font-black italic">
                Ready for message
              </p>
            </motion.div>
          ) : (
            messages.map((message, i) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                className={cn(
                  "flex gap-6 max-w-4xl mx-auto group",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className="flex-1 space-y-3">
                  <motion.div 
                    initial={{ opacity: 0, x: message.role === 'user' ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      "flex items-center gap-4 mb-2",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <span className="font-serif text-sm tracking-widest text-white/40 uppercase">
                      {message.role === 'user' ? settings.displayName : character.name}
                    </span>
                    <div className="h-px w-8 bg-white/5" />
                    <span className="text-[9px] text-white/10 uppercase tracking-tighter">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                  
                  <motion.div 
                    layout
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                    className={cn(
                      "p-6 text-[15px] leading-relaxed transition-all duration-700 backdrop-blur-md relative group",
                      message.role === 'user' 
                        ? "bg-white/[0.04] border border-white/10 text-white/90 selection:bg-gold-500/20" 
                        : "bg-gold-500/[0.02] border border-gold-500/10 text-gold-50/80 shadow-2xl"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0 w-8 h-[1px] bg-gold-400/20",
                      message.role === 'user' ? "right-0" : "left-0"
                    )} />
                    <div className="markdown-body prose prose-invert prose-p:leading-relaxed selection:text-white selection:bg-gold-900/50">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-6 max-w-4xl mx-auto"
          >
            <div className="bg-gold-500/[0.02] border border-gold-500/10 p-6 flex items-center gap-6">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-gold-400/30 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <span className="font-serif text-sm italic text-gold-400/40">Character is thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Form */}
      <footer className="p-6 md:p-12 bg-noir-950/80 backdrop-blur-2xl border-t border-white/5 z-20">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex items-end gap-6"
        >
          <div className="relative flex-1 group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={`Send a message...`}
              rows={1}
              className="w-full bg-transparent border-b border-white/10 py-4 px-0 focus:outline-none focus:border-gold-500/50 transition-all text-white placeholder:text-white/10 resize-none max-h-40 font-serif text-xl italic"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-4 text-gold-500 disabled:opacity-10 transition-all"
          >
            <Send size={28} strokeWidth={1} />
          </motion.button>
        </form>
      </footer>
    </div>
  );
}
