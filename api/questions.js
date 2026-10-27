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

    let filter;
    if (parentSubjectID) {
      filter = { parentSubjectID };

      // Thu thập các môn cần loại trừ khỏi danh sách tổng hợp
      const exclude = [];
      if (req.query?.exclude) {
        const rawExclude = Array.isArray(req.query.exclude) ? req.query.exclude : req.query.exclude.split(',');
        exclude.push(...rawExclude.map(s => s.trim()).filter(Boolean));
      }

      if (exclude.length > 0) {
        filter.subjectId = { $nin: exclude };
      }
    } else {
      filter = { subjectId };
    }

    let questions;

    if (parentSubjectID) {
      // Lấy danh sách thứ tự môn con theo trường order trong collection subjects
      const childSubs = await db.collection('subjects')
        .find({ parentId: parentSubjectID })
        .sort({ order: 1 })
        .toArray();
      const subOrderMap = {};
      childSubs.forEach((s, idx) => {
        subOrderMap[s.id] = (s.order !== undefined && s.order !== null) ? Number(s.order) : (idx + 1);
      });

      questions = await questionsColl
        .find(filter, { projection: { _id: 0 } })
        .toArray();

      questions.sort((a, b) => {
        const orderA = subOrderMap[a.subjectId] ?? 999;
        const orderB = subOrderMap[b.subjectId] ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        if (a.subjectId !== b.subjectId) return String(a.subjectId).localeCompare(String(b.subjectId));
        return (Number(a.id) || 0) - (Number(b.id) || 0);
      });
    } else {
      questions = await questionsColl
        .find(filter, { projection: { _id: 0 } })
        .sort({ id: 1 })
        .toArray();
    }

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
