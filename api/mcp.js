import { createClient } from 'redis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventType, limit } = req.body || {};
  const max = limit && limit <= 200 ? limit : 100;

  const redis = createClient({ url: process.env.REDIS_URL });

  try {
    await redis.connect();
    const keys = await redis.lRange('event_index', 0, max - 1);
    const events = [];

    for (const key of keys) {
      const raw = await redis.get(key);
      if (raw) {
        const event = JSON.parse(raw);
        if (!eventType || event.event_type === eventType) {
          events.push(event);
        }
      }
    }
    await redis.quit();

    return res.status(200).json({ events });
  } catch (err) {
    console.error('Read failure:', err);
    return res.status(500).json({ error: 'Read failure' });
  }
}
