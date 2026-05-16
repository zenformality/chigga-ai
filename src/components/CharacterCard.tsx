import { motion } from 'motion/react';
import { Character } from '../types';
import { cn } from '../lib/utils';
import { Globe, Lock } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
  isSelected?: boolean;
}

export default function CharacterCard({ character, onSelect, isSelected }: CharacterCardProps) {
  return (
    <motion.button
      whileHover={{ y: -8 }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      onClick={() => onSelect(character)}
      className={cn(
        "relative rounded-none p-6 text-left transition-all duration-700 group overflow-hidden h-[420px] flex flex-col",
        "bg-noir-900 border border-white/5",
        isSelected && "ring-1 ring-gold-500/30"
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-noir-950 via-noir-950/80 to-transparent z-10" />
      
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={character.avatar} 
          alt={character.name}
          className="w-full h-full object-cover grayscale-[0.2] brightness-75 group-hover:brightness-100 group-hover:scale-110 transition-all duration-1000 ease-out"
        />
        {character.isPublic && (
          <div className="absolute top-4 right-4 z-30 transition-opacity duration-500 opacity-0 group-hover:opacity-100">
            <div className="p-2 bg-black/60 backdrop-blur-md rounded-full border border-gold-500/30">
              <Globe size={12} className="text-gold-500" />
            </div>
          </div>
        )}
      </div>

      <div className="relative z-20 mt-auto space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-serif text-white tracking-wide group-hover:text-gold-400 transition-colors duration-500">
              {character.name}
            </h3>
            {character.authorName && (
              <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-sans pb-1">
                by {character.authorName}
              </span>
            )}
          </div>
          <p className="font-script text-xl text-gold-500/60 leading-none">
            {character.isCustom ? (character.isPublic ? 'Public' : 'Private') : 'Featured'}
          </p>
        </div>
        
        <p className="text-[13px] text-white/50 line-clamp-3 leading-relaxed font-light font-sans group-hover:text-white/80 transition-colors duration-500">
          {character.description}
        </p>

        <div className="pt-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10 group-hover:bg-gold-500/30 transition-colors" />
          <span className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-sans">Select</span>
        </div>
      </div>
    </motion.button>
  );
}
