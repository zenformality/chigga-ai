import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MessageSquare, History, Settings, LogOut, User, X, Shield, ShieldOff } from 'lucide-react';
import { Character, ChatSession, UserSettings } from '../types';
import { CHARACTERS } from '../constants';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';

interface SidebarProps {
  sessions: ChatSession[];
  characters: Character[];
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onLogout: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

export default function Sidebar({ 
  sessions, 
  characters, 
  activeSessionId, 
  onSessionSelect, 
  onNewChat, 
  onDeleteSession, 
  onLogout,
  settings,
  onUpdateSettings
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="w-full md:w-72 h-full border-r border-white/5 bg-noir-800 flex flex-col p-8 z-20">
      <div className="flex flex-col gap-1 mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-gold-500/30 flex items-center justify-center font-serif text-gold-500 text-xl italic shadow-[0_0_15px_rgba(197,160,89,0.1)]">C</div>
            <h1 className="font-serif text-3xl text-white tracking-widest uppercase">Chigga </h1>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-white/20 hover:text-gold-500 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
        <div className="h-px w-12 bg-gold-500/50 mt-2" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
        <h2 className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-medium font-sans">
          Library
        </h2>
        
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="py-8 text-white/10 text-[11px] uppercase tracking-widest font-serif italic border border-dashed border-white/5 flex items-center justify-center">
              No recent chats
            </div>
          ) : (
            sessions.sort((a, b) => b.updatedAt - a.updatedAt).map((session) => {
              const character = characters.find(c => c.id === session.characterId);
              return (
                <div
                  key={session.id}
                  onClick={() => onSessionSelect(session.id)}
                  className={cn(
                    "w-full p-4 transition-all duration-500 group relative cursor-pointer",
                    activeSessionId === session.id 
                      ? "bg-white/[0.03]" 
                      : "hover:bg-white/[0.01]"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={character?.avatar} 
                        className={cn(
                          "w-12 h-12 object-cover transition-all duration-700 grayscale brightness-75",
                          activeSessionId === session.id ? "grayscale-0 brightness-110" : "group-hover:grayscale-0 group-hover:brightness-100"
                        )} 
                        alt="" 
                      />
                      {activeSessionId === session.id && (
                        <div className="absolute inset-0 ring-1 ring-inset ring-gold-500/40" />
                      )}
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className={cn(
                        "font-serif text-lg tracking-wide transition-colors",
                        activeSessionId === session.id ? "text-gold-400" : "text-white/40"
                      )}>
                        {character?.name}
                      </div>
                      <div className="text-[10px] text-white/10 truncate font-sans uppercase tracking-tighter">
                        Active chat
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-white/10 hover:text-red-500/50 transition-all"
                  >
                    <X size={12} />
                  </button>

                  {activeSessionId === session.id && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold-500 shadow-[0_0_8px_rgba(197,160,89,0.5)]" 
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-auto pt-8 space-y-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="w-full py-4 bg-transparent border border-white/5 flex items-center justify-center gap-3 hover:border-gold-500/30 transition-all group"
        >
          <span className="text-[10px] font-sans uppercase tracking-[0.4em] text-white/30 group-hover:text-gold-400 transition-colors">Start New Chat</span>
        </motion.button>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-white/[0.02]">
              <img 
                src={auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${auth.currentUser?.uid}`} 
                alt="User" 
                className="w-full h-full object-cover grayscale opacity-30"
              />
            </div>
            <div className="overflow-hidden">
              <div className="text-[11px] font-serif tracking-widest text-white/60 truncate max-w-[120px] uppercase">
                {settings.displayName}
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-white/20 hover:text-gold-500 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-noir-900 border border-white/10 p-8 space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
              
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif text-white tracking-widest italic uppercase">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-white/20 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-sans">Display Name</label>
                  <input 
                    type="text"
                    value={settings.displayName}
                    onChange={(e) => onUpdateSettings({ ...settings, displayName: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/5 p-4 text-white focus:outline-none focus:border-gold-500/50 transition-all font-serif italic"
                  />
                  <p className="text-[9px] text-white/10 uppercase italic">How the bots will address you</p>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-sans">Content Filter</span>
                        {settings.isNsfw ? <ShieldOff size={10} className="text-red-500/50" /> : <Shield size={10} className="text-gold-500/50" />}
                      </div>
                      <p className="text-[11px] text-white/60 font-serif italic">{settings.isNsfw ? "NSFW Mode Active" : "SFW Mode Active"}</p>
                    </div>
                    <button 
                      onClick={() => onUpdateSettings({ ...settings, isNsfw: !settings.isNsfw })}
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors duration-500",
                        settings.isNsfw ? "bg-red-900/40" : "bg-white/10"
                      )}
                    >
                      <motion.div 
                        animate={{ x: settings.isNsfw ? 24 : 0 }}
                        className={cn(
                          "w-4 h-4 rounded-full",
                          settings.isNsfw ? "bg-red-500 shadows-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-white/20"
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-[9px] text-white/10 leading-relaxed uppercase">
                    NSFW mode allows for unfiltered and explicit roleplay interactions. SFW mode uses standard filtering.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-4 text-center text-gold-500 border border-gold-500/20 hover:bg-gold-500/5 transition-all font-serif italic tracking-widest text-lg"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
