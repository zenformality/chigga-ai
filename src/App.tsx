import { useState, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from './lib/firebase';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Character, ChatSession, Message, UserSettings } from './types';
import { CHARACTERS } from './constants';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import CharacterCard from './components/CharacterCard';
import CreateCharacterModal from './components/CreateCharacterModal';
import { Sparkles, ShieldAlert, Plus, Menu, Globe, User, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';
import { usePublicCharacters } from './hooks/usePublicCharacters';
import { useSessions } from './hooks/useSessions';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const { sessions, setSessions, saveSession, deleteSession, loading: sessionsLoading } = useSessions(user);
  const [isVerified, setIsVerified] = useLocalStorage<boolean>('ewandchi_age_verified', false);
  const [settings, setSettings] = useLocalStorage<UserSettings>('ewandchi_settings', {
    displayName: auth.currentUser?.displayName || 'User',
    isNsfw: false
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSelectingCharacter, setIsSelectingCharacter] = useState(false);
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [registryTab, setRegistryTab] = useState<'personal' | 'global'>('personal');

  const { characters: registryCharacters, loading: publicLoading } = usePublicCharacters();

  const allCharacters = useMemo(() => {
    // Combine signature characters and registry characters (which include user's custom ones)
    return [...CHARACTERS, ...registryCharacters];
  }, [registryCharacters]);

  const displayedCharacters = useMemo(() => {
    if (registryTab === 'personal') {
      return [...CHARACTERS, ...registryCharacters.filter(c => c.authorId === user?.uid)];
    }
    return registryCharacters;
  }, [registryTab, registryCharacters, user]);

  const activeSession = useMemo(() => 
    sessions.find(s => s.id === activeSessionId),
    [sessions, activeSessionId]
  );

  const activeCharacter = useMemo(() => 
    allCharacters.find(c => c.id === activeSession?.characterId),
    [activeSession, allCharacters]
  );

  // Close sidebar on session change for mobile
  const handleSessionSelect = (id: string) => {
    setActiveSessionId(id);
    setIsSelectingCharacter(false);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    setIsSelectingCharacter(true);
    setIsSidebarOpen(false);
  };

  // Fixed sender to handle both user and assistant explicitly
  const addMessage = (content: string, role: 'user' | 'assistant') => {
    if (!activeSessionId) return;
    setSessions(prev => {
      const updated = prev.map(session => {
        if (session.id === activeSessionId) {
          const newSession = {
            ...session,
            messages: [...session.messages, { id: Date.now().toString(), content, role, timestamp: Date.now() }],
            updatedAt: Date.now(),
          };
          saveSession(newSession); // Async sync to DB
          return newSession;
        }
        return session;
      });
      return updated;
    });
  };

  const createSession = (character: Character) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      characterId: character.id,
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions(prev => [...prev, newSession]);
    saveSession(newSession); // Async sync to DB
    setActiveSessionId(newSession.id);
    setIsSelectingCharacter(false);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  const clearChat = () => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId ? { ...session, messages: [] } : session
    ));
  };

  const logout = () => {
    auth.signOut();
    setIsVerified(false);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full border-t-2 border-white/20"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <Layout>
        <Auth />
      </Layout>
    );
  }

  if (!isVerified) {
    return (
      <Layout>
        <div className="flex items-center justify-center w-full h-full p-8 bg-noir-950">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full p-12 border border-white/5 relative group text-center space-y-12"
          >
            <div className="absolute inset-0 bg-gold-500/[0.01] blur-3xl opacity-50" />
            
            <div className="space-y-4 relative z-10">
              <h2 className="text-4xl md:text-5xl font-serif text-white tracking-widest uppercase">Age Verification</h2>
              <div className="h-px w-16 bg-gold-500/50 mx-auto" />
              <p className="text-gold-500/60 font-serif italic text-xl pt-4">
                Please confirm your age to continue
              </p>
            </div>

            <p className="text-white/30 text-sm leading-relaxed font-sans max-w-sm mx-auto uppercase tracking-tighter">
              By proceeding, you verify that you are <span className="text-white font-serif italic text-lg tracking-normal">18 years or older</span> and accept the terms of service.
            </p>

            <div className="flex flex-col gap-4 relative z-10">
              <button 
                onClick={() => setIsVerified(true)}
                className="w-full py-5 bg-transparent border border-white/10 text-white font-serif italic text-2xl hover:border-gold-500/50 transition-all duration-500"
              >
                I am 18+
              </button>
              <button 
                onClick={logout}
                className="text-[10px] uppercase tracking-[0.5em] text-white/10 hover:text-white/40 transition-colors font-sans"
              >
                Exit
              </button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300",
        isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsSidebarOpen(false)} />

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform md:relative md:translate-x-0 transition-transform duration-300 ease-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          sessions={sessions}
          characters={allCharacters}
          activeSessionId={activeSessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onLogout={logout}
          settings={settings}
          onUpdateSettings={setSettings}
        />
      </aside>

      <main className="flex-1 flex flex-col h-full bg-[#050505]/50 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {isSelectingCharacter ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-full w-full overflow-y-auto p-6 md:p-20 flex flex-col items-center"
            >
              <div className="max-w-6xl w-full space-y-12">
                <div className="flex items-center gap-3 md:hidden mb-8">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 text-white/40 hover:text-gold-500 transition-colors"
                  >
                    <Menu size={28} strokeWidth={1} />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border border-gold-500/20 flex items-center justify-center font-serif text-gold-500 text-lg italic">C</div>
                    <h1 className="font-serif text-3xl text-white tracking-widest uppercase">Chigga ai</h1>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                  <div className="space-y-4">
                    <h2 className="text-4xl md:text-7xl font-serif text-white tracking-tight italic">
                      My Library
                    </h2>
                    <div className="flex items-center gap-6 pt-4">
                      <button
                        onClick={() => setRegistryTab('personal')}
                        className={cn(
                          "flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-medium transition-all duration-500 pb-2 border-b",
                          registryTab === 'personal' ? "text-gold-500 border-gold-500" : "text-white/20 border-transparent hover:text-white/40"
                        )}
                      >
                        <User size={12} />
                        My Characters
                      </button>
                      <button
                        onClick={() => setRegistryTab('global')}
                        className={cn(
                          "flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-medium transition-all duration-500 pb-2 border-b",
                          registryTab === 'global' ? "text-gold-500 border-gold-500" : "text-white/20 border-transparent hover:text-white/40"
                        )}
                      >
                        <Globe size={12} />
                        Explore Registry
                      </button>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCreatingCharacter(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-transparent border border-white/10 rounded-none hover:border-gold-500/50 transition-all text-white/60 font-serif italic text-lg"
                  >
                    <Plus size={18} className="text-gold-500" />
                    Create Character
                  </motion.button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 border-l border-t border-white/5">
                  {publicLoading && registryTab === 'global' ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="animate-spin text-gold-500/20" size={40} strokeWidth={1} />
                      <p className="text-gold-500/20 font-serif italic uppercase tracking-widest text-[10px]">Loading public library...</p>
                    </div>
                  ) : displayedCharacters.length === 0 ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center space-y-4 border-r border-b border-white/5">
                      <p className="text-white/10 font-serif italic text-xl uppercase tracking-widest">Library is empty</p>
                      <p className="text-white/5 text-[10px] uppercase tracking-[0.3em]">No characters found here.</p>
                    </div>
                  ) : (
                    displayedCharacters.map(character => (
                      <div key={character.id} className="border-r border-b border-white/5">
                        <CharacterCard 
                          character={character} 
                          onSelect={createSession} 
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : activeSession && activeCharacter ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <ChatWindow 
                character={activeCharacter}
                messages={activeSession.messages}
                onSendMessage={(content, role) => addMessage(content, role)}
                onClearChat={clearChat}
                onMenuToggle={() => setIsSidebarOpen(true)}
                settings={settings}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center space-y-10 text-center px-6 relative"
            >
              <div className="md:hidden absolute top-10 left-10">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 text-white/20 hover:text-gold-500"
                >
                  <Menu size={28} strokeWidth={1} />
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent -top-10" />
                <h3 className="text-4xl md:text-6xl font-serif text-white tracking-widest italic opacity-80">Welcome to Chigga ai</h3>
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent -bottom-10" />
              </div>

              <p className="text-gold-500/30 max-w-sm font-serif italic text-lg md:text-xl">
                Ready to talk? Choose a character from your library or create a new one.
              </p>

              <motion.button
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSelectingCharacter(true)}
                className="px-12 py-5 bg-transparent border border-gold-500/20 text-gold-500/60 font-serif italic text-2xl hover:text-gold-400 hover:border-gold-500/50 transition-all duration-700"
              >
                Browse Characters
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isCreatingCharacter && (
          <CreateCharacterModal 
            onClose={() => setIsCreatingCharacter(false)}
            onSave={(char) => {
              // Note: Character is already being saved to Neon in the modal if isPublic,
              // or it will be picked up by usePublicCharacters in next refetch.
              // For consistency, we handle it if it's private too
              if (!char.isPublic) {
                 fetch('/api/characters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(char)
                 }).catch(console.error);
              }
              setIsCreatingCharacter(false);
              createSession(char);
            }}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}

// Separate component to handle the side-effect of assistant replies
function AssistantResponseHandler({ sessionId, messages, addMessage }: { 
  sessionId: string | null; 
  messages: Message[]; 
  addMessage: (content: string, role: 'user' | 'assistant') => void;
}) {
  return null;
}
