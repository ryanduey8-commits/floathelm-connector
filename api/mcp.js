import { kv } from '@vercel/kv';

// Simple MCP-style endpoint that lets Claude query captured floathelm events.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventType, limit } = req.body || {};
  const max = limit && limit <= 200 ? limit : 100;

  try {
    const keys = await kv.lrange('event_index', 0, max - 1);
    const events = [];

    for (const key of keys) {
      const event = await kv.get(key);
      if (event && (!eventType || event.event_type === eventType)) {
        events.push(event);
      }
    }

    return res.status(200).json({ events });
  } catch (err) {
    console.error('Read failure:', err);
    return res.status(500).json({ error: 'Read failure' });
  }
}
