import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Save, Sparkles, UserCircle, Search, ExternalLink, Loader2, Wand2, Globe, Lock } from 'lucide-react';
import { Character } from '../types';
import { cn } from '../lib/utils';
import { enhanceField } from '../lib/gemini';
import { auth } from '../lib/firebase';

interface CreateCharacterModalProps {
  onClose: () => void;
  onSave: (character: Character) => void;
}

export default function CreateCharacterModal({ onClose, onSave }: CreateCharacterModalProps) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [prompt, setPrompt] = useState('');
  const [greeting, setGreeting] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80');
  const [isPublic, setIsPublic] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [enhancingField, setEnhancingField] = useState<'description' | 'soulDirectives' | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-extract Pinterest image
  useEffect(() => {
    const extractPinterest = async () => {
      if ((avatar.includes('pinterest.com/pin/') || avatar.includes('pin.it/')) && !avatar.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        setIsExtracting(true);
        setError(null);
        try {
          const res = await fetch(`/api/pinterest/extract?url=${encodeURIComponent(avatar)}`);
          const data = await res.json();
          if (data.imageUrl) {
            setAvatar(data.imageUrl);
          } else {
            setError("Could not extract image. Try copying the direct image address from Pinterest.");
          }
        } catch (err) {
          setError("Neural link to Pinterest failed. Use a direct image URL.");
        } finally {
          setIsExtracting(false);
        }
      }
    };

    const timer = setTimeout(extractPinterest, 1000);
    return () => clearTimeout(timer);
  }, [avatar]);

  // Clear error when user types name
  useEffect(() => {
    if (name.trim() && error === "Provide a name before seeking divine inspiration.") {
      setError(null);
    }
  }, [name, error]);

  const handleEnhanceField = async (field: 'description' | 'soulDirectives') => {
    if (!name.trim()) {
      setError("Provide a name before seeking divine inspiration.");
      return;
    }
    setEnhancingField(field);
    setError(null);
    try {
      const currentVal = field === 'description' ? desc : prompt;
      const enhanced = await enhanceField(field, name, currentVal);
      if (field === 'description') setDesc(enhanced);
      else setPrompt(enhanced);
    } catch (err: any) {
      setError(`The muse is silent. ${err?.message || "Please try again later."}`);
    } finally {
      setEnhancingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !prompt) return;

    setIsPublishing(true);
    setError(null);

    const character: Character = {
      id: `custom-${Date.now()}`,
      name,
      description: desc || `A unique presence named ${name}.`,
      avatar,
      systemPrompt: prompt,
      greeting: greeting || undefined,
      theme: 'from-gold-500/10 to-noir-900',
      isCustom: true,
      isPublic,
      authorId: auth.currentUser?.uid,
      authorName: auth.currentUser?.displayName || 'Unknown Architect',
      createdAt: Date.now()
    };

    try {
      if (isPublic) {
        // Save to Neon DB
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(character)
        });
        if (!res.ok) {
          throw new Error('Failed to save to database');
        }
      }
      onSave(character);
    } catch (err) {
      console.error("Failed to manifest essence publicly:", err);
      setError("The portal to the public archives is closed. Essence saved locally only.");
      // Still call onSave to save locally
      onSave(character);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl bg-noir-950 border border-white/5 relative shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-gold-500/50" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-gold-500/50" />

        <div className="p-10 border-b border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif text-white tracking-widest uppercase">Create Character</h2>
            <p className="font-script text-xl text-gold-500/60 leading-none lowercase">Configure your character</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
            <X size={24} strokeWidth={1} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
          <div className="flex gap-12 flex-col md:flex-row">
            <div className="space-y-6">
              <label className="block text-[10px] font-sans uppercase tracking-[0.5em] text-white/30">Avatar</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl pointer-events-none" />
                <img 
                  src={avatar} 
                  className={cn(
                    "w-40 h-56 object-cover border border-white/5 group-hover:border-gold-500/30 transition-all duration-700 relative z-10",
                    isExtracting && "opacity-50 grayscale"
                  )} 
                  alt="Preview" 
                />
                {isExtracting && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <Loader2 className="text-gold-500 animate-spin" size={32} strokeWidth={1} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-white/20 block">Image Source (or Pinterest Link)</label>
                <input 
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Paste URL..."
                  className="w-full bg-transparent border-b border-white/10 px-0 py-2 text-xs font-serif italic text-white placeholder:text-white/10 focus:outline-none focus:border-gold-500/50 transition-all"
                />
                {error && <p className="text-[9px] text-red-500/60 lowercase italic">{error}</p>}
                {!error && !isExtracting && avatar.includes('pinimg.com') && (
                  <p className="text-[9px] text-gold-500/40 lowercase italic">Image link matched</p>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-10">
              <div className="space-y-4">
                <label className="block text-[10px] font-sans uppercase tracking-[0.5em] text-white/30">Character Name</label>
                <input 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lysander"
                  className={cn(
                    "w-full bg-transparent border-b border-white/10 px-0 py-4 font-serif text-2xl italic text-white placeholder:text-white/5 focus:outline-none focus:border-gold-500/50 transition-all",
                    error === "Provide a name before seeking divine inspiration." && "border-red-500/50"
                  )}
                />
                {error === "Provide a name before seeking divine inspiration." && (
                  <p className="text-[10px] text-red-500/80 italic lowercase animate-pulse">Character name is required for AI enhancement.</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-sans uppercase tracking-[0.5em] text-white/30">Brief Description</label>
                  <button
                    type="button"
                    onClick={() => handleEnhanceField('description')}
                    disabled={enhancingField !== null}
                    className="text-[9px] uppercase tracking-widest text-gold-500/60 hover:text-gold-400 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {enhancingField === 'description' ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                    {enhancingField === 'description' ? 'Enhancing...' : 'Auto-Generate'}
                  </button>
                </div>
                <input 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="A short tagline..."
                  className="w-full bg-transparent border-b border-white/10 px-0 py-4 font-serif text-lg italic text-white/60 placeholder:text-white/5 focus:outline-none focus:border-gold-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-sans uppercase tracking-[0.5em] text-white/30">Persona Instructions</label>
              <button
                type="button"
                onClick={() => handleEnhanceField('soulDirectives')}
                disabled={enhancingField !== null}
                className="text-[9px] uppercase tracking-widest text-gold-500/60 hover:text-gold-400 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {enhancingField === 'soulDirectives' ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                {enhancingField === 'soulDirectives' ? 'Enhancing...' : 'Auto-Generate'}
              </button>
            </div>
            <textarea 
              required
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="How should the character behave? (e.g. 'You are a friendly cat...')"
              className="w-full bg-transparent border border-white/10 p-6 font-serif text-lg italic text-white/80 placeholder:text-white/20 focus:outline-none focus:border-gold-500/30 transition-all resize-none"
            />
          </div>

          <div className="space-y-6">
            <label className="block text-[10px] font-sans uppercase tracking-[0.5em] text-white/30">First Message</label>
            <textarea 
              required
              rows={2}
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="What do they say first? (e.g. *smiles* 'Hello there!')"
              className="w-full bg-transparent border border-white/10 p-6 font-serif text-lg italic text-white/80 placeholder:text-white/20 focus:outline-none focus:border-gold-500/30 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              {isPublic ? <Globe className="text-gold-500" size={18} /> : <Lock className="text-white/20" size={18} />}
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-white/60">Public Sharing</span>
                <span className="text-[9px] text-white/30 lowercase italic">
                  {isPublic ? "Available to everyone" : "Private to you"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                "w-12 h-6 rounded-full transition-all duration-500 relative shrink-0",
                isPublic ? "bg-gold-500/40" : "bg-white/5"
              )}
            >
              <div className={cn(
                "absolute top-1 left-1 w-4 h-4 rounded-full transition-all duration-500 bg-white shadow-xl",
                isPublic ? "translate-x-6 bg-gold-500" : "translate-x-0"
              )} />
            </button>
          </div>

          <button
            type="submit"
            disabled={isPublishing}
            className="w-full py-6 bg-transparent border border-white/10 text-white font-serif text-xl italic hover:border-gold-500 transition-all duration-700 relative group overflow-hidden disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gold-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
            <div className="relative z-10 flex items-center justify-center gap-3">
              {isPublishing && <Loader2 className="animate-spin" size={20} />}
              <span>{isPublishing ? 'Saving...' : 'Save and Start Chatting'}</span>
            </div>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
