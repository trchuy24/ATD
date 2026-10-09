const { getDb } = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Security: only allow GET method
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security & Cache headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  try {
    const db = await getDb();
    const subjectsColl = db.collection('subjects');

    const subjectId = req.query?.id || req.query?.subject;

    if (subjectId) {
      const subject = await subjectsColl.findOne(
        { id: subjectId },
        { projection: { _id: 0 } }
      );
      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }
      return res.status(200).json(subject);
    }

    // Retrieve all subjects sorted by order (default fallback to 999)
    const list = await subjectsColl
      .find({}, { projection: { _id: 0, questions: 0, icon: 0, group: 0 } })
      .sort({ order: 1, _id: 1 })
      .toArray();

    // Map into dictionary indexed by subject id
    const subjectsMap = {};
    for (const sub of list) {
      subjectsMap[sub.id] = sub;
    }

    return res.status(200).json(subjectsMap);
  } catch (error) {
    console.error('[API Error /api/subjects]:', error.message);
    // Security: Do not expose raw error details / stack trace / db credentials to client
    return res.status(500).json({
      error: 'Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.'
    });
  }
};
