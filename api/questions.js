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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  const subjectId = req.query?.subject || req.query?.id;
  const parentSubjectID = req.query?.parentSubjectID || req.query?.parentId;

  if (!subjectId && !parentSubjectID) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tham số subject (ví dụ: ?subject=atd) hoặc parentSubjectID' });
  }

  try {
    const db = await getDb();
    const questionsColl = db.collection('questions');

    const filter = parentSubjectID ? { parentSubjectID } : { subjectId };

    const questions = await questionsColl
      .find(filter, { projection: { _id: 0 } })
      .sort({ id: 1 })
      .toArray();

    return res.status(200).json({
      subjectId: subjectId || null,
      parentSubjectID: parentSubjectID || null,
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
