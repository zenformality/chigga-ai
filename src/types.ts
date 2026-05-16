export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string;
  theme: string;
  greeting?: string;
  isCustom?: boolean;
  isPublic?: boolean;
  authorId?: string;
  authorName?: string;
  createdAt?: number;
}

export interface ChatSession {
  id: string;
  characterId: string;
  messages: Message[];
  updatedAt: number;
}

export interface UserSettings {
  displayName: string;
  isNsfw: boolean;
}
