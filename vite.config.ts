import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const metProxy = {
  '/api/met': {
    target: 'https://api.met.no',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/met/, ''),
    headers: {
      'User-Agent': 'Utaktiv/1.0 (https://utaktiv.no)',
    },
  },
};

function readEnvKeys(): { geminiKey: string; openAiKey: string } {
  let geminiKey = process.env.GEMINI_API_KEY || '';
  let openAiKey = process.env.OPENAI_API_KEY || '';

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) continue;
        if (trimmed.startsWith('GEMINI_API_KEY=')) {
          geminiKey = trimmed.replace('GEMINI_API_KEY=', '').trim();
        } else if (trimmed.startsWith('OPENAI_API_KEY=')) {
          openAiKey = trimmed.replace('OPENAI_API_KEY=', '').trim();
        }
      }
    }
  } catch {
    // fallback
  }

  return { geminiKey, openAiKey };
}

function aiChatDevPlugin(): Plugin {
  return {
    name: 'ai-chat-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (req.method === 'POST' && (url.startsWith('/api/chat.php') || url.startsWith('/api/chat'))) {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const input = JSON.parse(body || '{}');
              const { geminiKey, openAiKey } = readEnvKeys();
              const messages = input.messages || [];
              const city = input.city || 'Bergen';
              const weather = input.weather || {};
              const profile = input.profile || {};

              const tempText = weather.temperatureC != null ? `${Math.round(weather.temperatureC)}°C` : 'mildt';
              const cloudText = weather.cloudCoverPercent != null ? `${weather.cloudCoverPercent}% skydekke` : 'varierende skydekke';
              const luxText = weather.lux != null ? `${weather.lux.toLocaleString('no-NO')} luks` : 'dagslys';
              const rainText = weather.precipitationMm > 0 ? `${weather.precipitationMm} mm/t regn` : 'opplett';
              const conditionText = weather.condition || 'opplett';

              const systemPrompt = `Du er Sol Concierge AI i Utaktiv.no, skapt av Alexander Robertsen (pedagog og forfatter i Bergen).
Tone: Varm, engasjert, lokalkjent, dagslys- og helsefokusert norsk. Maks 2 korte avsnitt.
SANNTIDSVÆR NÅ (${city}): ${conditionText}, ${tempText}, ${rainText}, ${cloudText}, ${luxText}.
Gi 1-2 konkrete forslag tilpasset været og barna hvis aktuelt. Hvis regn: badstue, kafé eller lun skog. Hvis opplett/sol: utsiktspunkter og fjellet!`;

              let reply = '';
              let model = '';
              let provider = '';

              // Forsøk Gemini 3.8 Flash først
              if (geminiKey) {
                try {
                  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
                  const geminiRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      systemInstruction: { parts: [{ text: systemPrompt }] },
                      contents: messages.map((m: any) => ({
                        role: m.role === 'user' ? 'user' : 'model',
                        parts: [{ text: m.content || '' }],
                      })),
                      generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                      },
                    }),
                  });
                  if (geminiRes.ok) {
                    const data = await geminiRes.json();
                    reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
                    if (reply) {
                      model = 'gemini-3.8-flash';
                      provider = 'gemini';
                    }
                  }
                } catch {
                  // Fallback to OpenAI
                }
              }

              // Fallback til OpenAI GPT-4o-mini hvis Gemini ikke svarte
              if (!reply && openAiKey) {
                try {
                  const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${openAiKey}`,
                    },
                    body: JSON.stringify({
                      model: 'gpt-4o-mini',
                      messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.map((m: any) => ({
                          role: m.role === 'user' ? 'user' : 'assistant',
                          content: m.content || '',
                        })),
                      ],
                      temperature: 0.7,
                      max_tokens: 350,
                    }),
                  });
                  if (openAiRes.ok) {
                    const oData = await openAiRes.json();
                    reply = oData?.choices?.[0]?.message?.content?.trim() || '';
                    if (reply) {
                      model = 'gpt-4o-mini';
                      provider = 'openai';
                    }
                  }
                } catch {
                  // Ignorer
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  reply: reply || 'Velkommen ut! Grip dagslyset og nyt frisk luft i dag.',
                  model: model || 'dev-fallback',
                  provider: provider || 'dev',
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Server error' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), aiChatDevPlugin()],
  server: {
    port: 5174,
    host: true,
    proxy: metProxy,
  },
  preview: {
    proxy: metProxy,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/leaflet')) {
            return 'vendor-leaflet';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('/src/engine/activities') || id.includes('/src/data/')) {
            return 'data-catalog';
          }
        },
      },
    },
  },
});
