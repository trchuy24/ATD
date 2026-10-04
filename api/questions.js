const { getDb } = require('../lib/mongodb');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  const subjectId = req.query?.subject || req.query?.id;
  if (!subjectId) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tham số subject (ví dụ: ?subject=atd)' });
  }

  try {
    const db = await getDb();
    const questionsColl = db.collection('questions');

    const questions = await questionsColl
      .find({ subjectId }, { projection: { _id: 0, subjectId: 0 } })
      .sort({ id: 1 })
      .toArray();

    return res.status(200).json({
      subjectId,
      total: questions.length,
      questions
    });
  } catch (error) {
    console.error('[API Error /api/questions]:', error.message);
    return res.status(500).json({
      error: 'Lỗi tải danh sách câu hỏi từ cơ sở dữ liệu.'
    });
  }
};
