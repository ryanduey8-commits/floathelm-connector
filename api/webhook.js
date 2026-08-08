import { createClient } from 'redis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const eventType = payload.event_type || 'unknown';
  const timestamp = new Date().toISOString();
  const key = `event:${timestamp}:${Math.random().toString(36).slice(2, 8)}`;

  const redis = createClient({ url: process.env.REDIS_URL });

  try {
    await redis.connect();
    await redis.set(key, JSON.stringify({
      event_type: eventType,
      received_at: timestamp,
      location_id: payload.location_id || null,
      location_title: payload.location_title || null,
      payload,
    }));
    await redis.lPush('event_index', key);
    await redis.quit();

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Storage failure:', err);
    return res.status(500).json({ error: 'Storage failure' });
  }
}
