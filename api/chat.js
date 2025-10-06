// /api/chat.js
export default async function handler(req, res) {
  // CORS: safe for same-origin and previews
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, route: '/api/chat' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages array required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are Lubby Llama 🦙, a friendly AI assistant for Sims 4, Roblox, and Minecraft troubleshooting. Be warm, use llama phrases like "No prob-llama!", and keep it teen-friendly.'
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    let data;
    try { data = await resp.json(); } catch {
      const text = await resp.text();
      return res.status(resp.status).json({ error: 'AI service error', details: text });
    }

    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'AI service error', details: data });
    }

    return res.status(200).json({ message: data.choices?.[0]?.message?.content ?? 'No response' });
  } catch (e) {
    console.error('chat.js error:', e);
    return res.status(500).json({ error: 'Internal server error', details: String(e) });
  }
}
