const store = require('../database').houses;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

const SYSTEM = `You are a friendly real-estate assistant for a house-finding website.
Help users find homes by asking about budget, city, bedrooms, buy vs rent and must-have amenities.
Always use the search_houses tool to look up listings; never invent listings or prices.
When recommending, mention title, city, price, bedrooms, and whether a video tour or 3D view is available.
Keep replies short and conversational. Always include the ids of recommended houses in your final answer via the house_ids you saw in tool results.`;

const TOOLS = [
  {
    name: 'search_houses',
    description: 'Search available house listings. All filters are optional.',
    input_schema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Free-text keywords' },
        city: { type: 'string' },
        minPrice: { type: 'number' },
        maxPrice: { type: 'number' },
        bedrooms: { type: 'number', description: 'Minimum bedrooms' },
        bathrooms: { type: 'number', description: 'Minimum bathrooms' },
        type: { type: 'string', enum: ['house', 'villa', 'apartment', 'studio'] },
        listingType: { type: 'string', enum: ['sale', 'rent'] },
        amenities: { type: 'string', description: 'Comma-separated, e.g. "pool,garden"' },
        hasVideo: { type: 'boolean' },
        has3d: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get_house',
    description: 'Get full details of one listing by id.',
    input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
];

const summary = (h) => ({
  id: h.id, title: h.title, city: h.city, price: h.price, listingType: h.listingType, type: h.type,
  bedrooms: h.bedrooms, bathrooms: h.bathrooms, areaSqm: h.areaSqm, amenities: h.amenities,
  hasVideo: !!(h.videos && h.videos.length), has3d: !!(h.models3d && h.models3d.length),
});

function runTool(name, input) {
  if (name === 'search_houses') {
    const q = { ...input };
    for (const k of ['hasVideo', 'has3d']) if (q[k] !== undefined) q[k] = String(q[k]);
    return store.search(q).slice(0, 8).map(summary);
  }
  if (name === 'get_house') {
    const h = store.get(input.id);
    return h ? { ...summary(h), description: h.description, address: h.address } : { error: 'not found' };
  }
  return { error: 'unknown tool' };
}

async function claudeChat(messages) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();
  const convo = messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) }));
  const seen = new Map();

  for (let i = 0; i < 5; i++) {
    const resp = await client.messages.create({
      model: MODEL, max_tokens: 1024, system: SYSTEM, tools: TOOLS, messages: convo,
    });
    if (resp.stop_reason !== 'tool_use') {
      const reply = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      const ids = [...seen.keys()].filter((id) => reply.includes(seen.get(id)) || reply.includes(id));
      return { reply, houses: ids.map((id) => store.get(id)).filter(Boolean), mode: 'claude' };
    }
    convo.push({ role: 'assistant', content: resp.content });
    const results = [];
    for (const block of resp.content.filter((b) => b.type === 'tool_use')) {
      const out = runTool(block.name, block.input);
      (Array.isArray(out) ? out : [out]).forEach((h) => h && h.id && seen.set(h.id, h.title));
      results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(out) });
    }
    convo.push({ role: 'user', content: results });
  }
  return { reply: 'Sorry, I could not finish that search. Could you rephrase?', houses: [], mode: 'claude' };
}

// Simple keyword assistant used when no ANTHROPIC_API_KEY is configured.
function fallbackChat(messages) {
  const text = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() || '';
  if (/^(hi|hello|hey)\b/.test(text) || !text.trim()) {
    return { reply: 'Hi! Tell me what you are looking for — city, budget, bedrooms, rent or buy — and I will find matches.', houses: [], mode: 'basic' };
  }
  const q = {};
  const cities = [...new Set(store.all().map((h) => h.city))];
  const city = cities.find((c) => text.includes(c.toLowerCase()));
  if (city) q.city = city;
  const bed = text.match(/(\d+)\s*(?:bed|br|bedroom)/);
  if (bed) q.bedrooms = bed[1];
  const under = text.match(/(?:under|below|max|less than|up to)\s*\$?\s*([\d,.]+)\s*(k)?/);
  if (under) q.maxPrice = parseFloat(under[1].replace(/,/g, '')) * (under[2] ? 1000 : 1);
  if (/\brent/.test(text)) q.listingType = 'rent';
  else if (/\b(buy|sale|purchase)/.test(text)) q.listingType = 'sale';
  for (const t of ['villa', 'apartment', 'studio', 'house']) if (text.includes(t)) { q.type = t; break; }
  if (/video|tour/.test(text)) q.hasVideo = 'true';
  if (/3d|virtual/.test(text)) q.has3d = 'true';
  const am = ['pool', 'garden', 'gym', 'parking', 'wifi', 'security', 'elevator'].filter((a) => text.includes(a));
  if (am.length) q.amenities = am.join(',');

  const found = store.search(q).slice(0, 5);
  if (!found.length) {
    return { reply: 'I could not find a match. Try widening your budget or choosing another city.', houses: [], mode: 'basic' };
  }
  return {
    reply: `I found ${found.length} listing${found.length > 1 ? 's' : ''} for you. Open any card to watch the video tour or explore it in 3D.`,
    houses: found, mode: 'basic',
  };
}

async function chat(messages) {
  if (process.env.ANTHROPIC_API_KEY) return claudeChat(messages);
  return fallbackChat(messages);
}

module.exports = { chat };
