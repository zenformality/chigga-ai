import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from 'cheerio';
import { Pool } from "pg";
import dotenv from "dotenv";
import { generateGeminiResponse, generateHFResponse, enhanceCharacter, enhanceField, generateGreeting } from "./server/ai";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDb() {
  if (!process.env.DATABASE_URL) return;
  try {
    // Characters table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        avatar TEXT NOT NULL,
        system_prompt TEXT NOT NULL,
        greeting TEXT,
        theme VARCHAR(255),
        is_public BOOLEAN DEFAULT false,
        author_id VARCHAR(255),
        author_name VARCHAR(255),
        created_at BIGINT
      )
    `);

    // Sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        character_id VARCHAR(255) NOT NULL,
        author_id VARCHAR(255) NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `);

    // Messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        timestamp BIGINT NOT NULL
      )
    `);
    console.log("Database initialized");
  } catch (err) {
    console.error("DB Init Error:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  // Root health check
  app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.send('OK');
  });

  // Non-blocking DB init
  initDb().then(() => console.log("DB initialized successfully")).catch(err => console.error("Database initialization failed:", err));

  app.use(express.json());

  const apiRouter = express.Router();
  app.use('/api', apiRouter);

  // AI Greeting Endpoint
  apiRouter.post('/greeting', async (req, res) => {
    const { systemPrompt, mode, userName } = req.body;
    try {
      const response = await generateGreeting(systemPrompt, mode, userName);
      res.json({ response });
    } catch (error: any) {
      console.error("Greeting Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate greeting" });
    }
  });

  // AI Chat Endpoint
  apiRouter.post('/chat', async (req, res) => {
    const { prompt, systemPrompt, history, mode, userName } = req.body;
    try {
      let response = '';
      if (mode === 'nsfw') {
        response = await generateHFResponse(prompt, systemPrompt, true, userName);
      } else if (mode === 'sfw-gemini') {
        response = await generateGeminiResponse(prompt, systemPrompt, history, userName);
      } else if (mode === 'sfw-hf') {
        response = await generateHFResponse(prompt, systemPrompt, false, userName);
      } else {
        return res.status(400).json({ error: "Invalid mode" });
      }
      res.json({ response });
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // AI Enhance Endpoint
  apiRouter.post('/enhance', async (req, res) => {
    const { name, description, soulDirectives } = req.body;
    try {
      const result = await enhanceCharacter(name, description, soulDirectives);
      res.json(result);
    } catch (error: any) {
      console.error("Enhance Error:", error);
      res.status(500).json({ error: error.message || "Failed to enhance character" });
    }
  });

  // AI Enhance Field Endpoint
  apiRouter.post('/enhance-field', async (req, res) => {
    const { field, name, currentValue } = req.body;
    try {
      const result = await enhanceField(field, name, currentValue);
      res.json({ result });
    } catch (error: any) {
      console.error("Enhance Field Error:", error);
      res.status(500).json({ error: error.message || "Failed to enhance field" });
    }
  });

  apiRouter.get('/characters', async (req, res) => {
    if (!process.env.DATABASE_URL) {
      return res.json([]);
    }
    const { authorId } = req.query;
    try {
      let query = 'SELECT * FROM characters WHERE is_public = true';
      const params: any[] = [];
      
      if (authorId) {
        query += ' OR author_id = $1';
        params.push(authorId);
      }
      
      query += ' ORDER BY created_at DESC LIMIT 100';
      
      const result = await pool.query(query, params);
      const chars = result.rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        avatar: r.avatar,
        systemPrompt: r.system_prompt,
        greeting: r.greeting,
        theme: r.theme,
        isPublic: r.is_public,
        authorId: r.author_id,
        authorName: r.author_name,
        createdAt: parseInt(r.created_at, 10)
      }));
      res.json(chars);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch characters" });
    }
  });

  apiRouter.post('/characters', async (req, res) => {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "Database not configured" });
    }
    const c = req.body;
    try {
      await pool.query(`
        INSERT INTO characters (id, name, description, avatar, system_prompt, greeting, theme, is_public, author_id, author_name, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          avatar = EXCLUDED.avatar,
          system_prompt = EXCLUDED.system_prompt,
          greeting = EXCLUDED.greeting,
          theme = EXCLUDED.theme,
          is_public = EXCLUDED.is_public
      `, [c.id, c.name, c.description, c.avatar, c.systemPrompt, c.greeting, c.theme, c.isPublic, c.authorId, c.authorName, c.createdAt]);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to insert character" });
    }
  });

  // Session routes
  apiRouter.get('/sessions', async (req, res) => {
    const { authorId } = req.query;
    if (!authorId) return res.status(400).json({ error: "authorId required" });
    
    try {
      // Get sessions for this user
      const sessionsRes = await pool.query('SELECT * FROM sessions WHERE author_id = $1 ORDER BY updated_at DESC', [authorId]);
      
      const sessions = await Promise.all(sessionsRes.rows.map(async (s) => {
        const messagesRes = await pool.query('SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC', [s.id]);
        return {
          id: s.id,
          characterId: s.character_id,
          updatedAt: parseInt(s.updated_at, 10),
          messages: messagesRes.rows.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: parseInt(m.timestamp, 10)
          }))
        };
      }));
      
      res.json(sessions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  apiRouter.post('/sessions', async (req, res) => {
    const { id, characterId, authorId, updatedAt, messages } = req.body;
    try {
      await pool.query('BEGIN');
      
      await pool.query(`
        INSERT INTO sessions (id, character_id, author_id, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at
      `, [id, characterId, authorId, updatedAt]);

      // Simple approach: clear and re-insert messages for the session
      // Better production approach would be incremental sync, but this is robust for now
      await pool.query('DELETE FROM messages WHERE session_id = $1', [id]);
      
      for (const m of messages) {
        await pool.query(`
          INSERT INTO messages (id, session_id, role, content, timestamp)
          VALUES ($1, $2, $3, $4, $5)
        `, [m.id, id, m.role, m.content, m.timestamp]);
      }
      
      await pool.query('COMMIT');
      res.json({ success: true });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ error: "Failed to save session" });
    }
  });

  apiRouter.delete('/sessions/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // API to extract image from Pinterest URL
  apiRouter.get("/pinterest/extract", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!url.includes('pinterest.com/pin/') && !url.includes('pin.it/')) {
      return res.status(400).json({ error: "Invalid Pinterest URL" });
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Try to find og:image
      let imageUrl = $('meta[property="og:image"]').attr('content');
      
      if (!imageUrl) {
        imageUrl = $('meta[name="twitter:image"]').attr('content');
      }

      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(404).json({ error: "Could not find image on this page" });
      }
    } catch (error) {
      console.error("Pinterest extraction error:", error);
      res.status(500).json({ error: "Failed to extract image" });
    }
  });

  // API 404 handler
  apiRouter.use((req, res) => {
    console.warn(`404 API Route Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Log all other requests
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
