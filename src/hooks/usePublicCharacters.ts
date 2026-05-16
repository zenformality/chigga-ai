import { useState, useEffect } from 'react';
import { Character } from '../types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

export function usePublicCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) {
      setCharacters([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    async function fetchCharacters() {
      try {
        setLoading(true);
        const res = await fetch(`/api/characters?authorId=${user.uid}`);
        if (!res.ok) throw new Error('Failed to fetch from registry');
        const data = await res.json();
        if (isMounted) {
          setCharacters(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Failed to fetch public archive:", err);
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchCharacters();

    return () => { isMounted = false; };
  }, [user]);

  return { characters, loading, error };
}
