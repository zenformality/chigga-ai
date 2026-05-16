import { useState, useEffect, useCallback } from 'react';
import { ChatSession } from '../types';
import { User } from 'firebase/auth';

export function useSessions(user: User | null | undefined) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    async function fetchSessions() {
      try {
        const res = await fetch(`/api/sessions?authorId=${user?.uid}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (err) {
        console.error("Failed to fetch sessions from Neon:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [user]);

  // Sync back to Neon
  const saveSession = useCallback(async (session: ChatSession) => {
    if (!user) return;
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...session,
          authorId: user.uid
        })
      });
    } catch (err) {
      console.error("Failed to sync session to Neon:", err);
    }
  }, [user]);

  const deleteSession = useCallback(async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Failed to delete session from Neon:", err);
    }
  }, []);

  return { sessions, setSessions, saveSession, deleteSession, loading };
}
