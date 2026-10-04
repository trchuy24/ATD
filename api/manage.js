const { getDb } = require('../lib/mongodb');

// Simple in-memory rate limiting for brute-force protection
const failedAttempts = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record) return true;
  if (now > record.resetTime) {
    failedAttempts.delete(ip);
    return true;
  }
  return record.count < 10; // max 10 failed attempts per 15 mins
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = failedAttempts.get(ip) || { count: 0, resetTime: now + 15 * 60 * 1000 };
  record.count += 1;
  failedAttempts.set(ip, record);
}

function clearFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

function normalizeQuestions(rawList) {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item, idx) => {
    let qText = item.question || item.cau_hoi || '';
    let qId = item.id || item.cau_so || idx + 1;
    let explanation = item.explanation || item.giai_thich || '';

    let options = [];
    let correctIdx = typeof item.correctIndex === 'number' ? item.correctIndex : -1;

    // Format 1: options is array of { label, text }
    if (Array.isArray(item.options)) {
      options = item.options.map((opt, optIdx) => {
        if (typeof opt === 'string') {
          const defaultLabel = String.fromCharCode(97 + optIdx); // a, b, c, d...
          return { label: defaultLabel, text: opt };
        }
        return {
          label: (opt.label || String.fromCharCode(97 + optIdx)).toLowerCase(),
          text: opt.text || ''
        };
      });
    } 
    // Format 2: cac_lua_chon object { a: "...", b: "..." }
    else if (item.cac_lua_chon && typeof item.cac_lua_chon === 'object') {
      const targetAns = (item.dap_an || '').toLowerCase().trim();
      let optIdx = 0;
      for (const [lbl, txt] of Object.entries(item.cac_lua_chon)) {
        options.push({ label: lbl.toLowerCase(), text: String(txt) });
        if (lbl.toLowerCase().trim() === targetAns) {
          correctIdx = optIdx;
        }
        optIdx++;
      }
    }

    // If correctIndex is still not found, check item.dap_an / item.answer
    if (correctIdx === -1 && (item.dap_an || item.answer)) {
      const ans = String(item.dap_an || item.answer).toLowerCase().trim();
      const found = options.findIndex(o => o.label === ans || o.text.trim().toLowerCase() === ans);
      if (found !== -1) correctIdx = found;
    }

    return {
      id: Number(qId),
      question: qText.trim(),
      options,
      correctIndex: correctIdx >= 0 ? correctIdx : 0,
      explanation: explanation.trim()
    };
  });
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pin, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Quá nhiều lần nhập sai mã PIN. Vui lòng thử lại sau 15 phút.' });
  }

  const body = await parseBody(req);
  const action = req.query?.action || body.action;

  // Verify PIN
  const adminPinEnv = process.env.ADMIN_PIN || '241199';
  const providedPin = req.headers['x-admin-pin'] || body.adminPin;

  if (!providedPin || String(providedPin).trim() !== String(adminPinEnv).trim()) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ error: 'Mã PIN quản trị không chính xác' });
  }

  clearFailedAttempts(clientIp);

  // If action is just verify-pin, return success
  if (action === 'verify-pin') {
    return res.status(200).json({ success: true, message: 'Xác thực PIN thành công' });
  }

  let db;
  try {
    db = await getDb();
  } catch (dbErr) {
    console.error('[DB Connect Error]:', dbErr);
    return res.status(500).json({
      error: 'Không thể kết nối đến cơ sở dữ liệu MongoDB. Vui lòng kiểm tra whitelist IP trong MongoDB Atlas.'
    });
  }

  const subjectsColl = db.collection('subjects');
  const questionsColl = db.collection('questions');

  try {
    // ACTION 1: UPLOAD SUBJECT
    if (action === 'upload-subject') {
      const { title, icon, questions: rawQuestions, subjectId: customSubjectId } = body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Tên môn học không được để trống' });
      }

      const questions = normalizeQuestions(rawQuestions);
      if (questions.length === 0) {
        return res.status(400).json({ error: 'Ngân hàng câu hỏi trống hoặc sai định dạng' });
      }

      const baseSlug = customSubjectId ? slugify(customSubjectId) : slugify(title);
      const subjectId = baseSlug || 'mon_' + Date.now();

      const subjectData = {
        id: subjectId,
        title: title.trim(),
        subtitle: `Ngân hàng ${questions.length} câu hỏi`,
        icon: icon || '📚',
        totalQuestions: questions.length,
        questions: questions,
        updatedAt: new Date()
      };

      await subjectsColl.updateOne(
        { id: subjectId },
        { $set: subjectData },
        { upsert: true }
      );

      // Refresh questions collection
      await questionsColl.deleteMany({ subjectId });
      const questionDocs = questions.map(q => ({
        subjectId,
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || '',
        updatedAt: new Date()
      }));
      if (questionDocs.length > 0) {
        await questionsColl.insertMany(questionDocs);
      }

      return res.status(200).json({
        success: true,
        message: `Đã lưu thành công môn "${title}" với ${questions.length} câu hỏi!`,
        subject: subjectData
      });
    }

    // ACTION 2: UPDATE QUESTION
    if (action === 'update-question') {
      const { subjectId, questionId, question, options, correctIndex, explanation } = body;

      if (!subjectId || questionId === undefined) {
        return res.status(400).json({ error: 'Thiếu subjectId hoặc questionId' });
      }

      const qId = Number(questionId);
      const updateFields = {
        question: String(question || '').trim(),
        options: options || [],
        correctIndex: Number(correctIndex),
        explanation: String(explanation || '').trim(),
        updatedAt: new Date()
      };

      // Update in questions collection
      await questionsColl.updateOne(
        { subjectId, id: qId },
        { $set: updateFields }
      );

      // Also sync inside subjects collection embedded questions
      const subject = await subjectsColl.findOne({ id: subjectId });
      if (subject && Array.isArray(subject.questions)) {
        const updatedList = subject.questions.map(q => {
          if (q.id === qId) {
            return {
              ...q,
              question: updateFields.question,
              options: updateFields.options,
              correctIndex: updateFields.correctIndex,
              explanation: updateFields.explanation
            };
          }
          return q;
        });

        await subjectsColl.updateOne(
          { id: subjectId },
          { $set: { questions: updatedList, updatedAt: new Date() } }
        );
      }

      return res.status(200).json({
        success: true,
        message: `Đã cập nhật câu hỏi số ${qId} thành công!`
      });
    }

    // ACTION 3: ADD QUESTION
    if (action === 'add-question') {
      const { subjectId, question, options, correctIndex, explanation } = body;
      if (!subjectId) return res.status(400).json({ error: 'Thiếu subjectId' });

      // Determine new question id
      const lastQ = await questionsColl.find({ subjectId }).sort({ id: -1 }).limit(1).toArray();
      const newId = (lastQ.length > 0 ? Number(lastQ[0].id) : 0) + 1;

      const newQ = {
        subjectId,
        id: newId,
        question: String(question || '').trim(),
        options: options || [],
        correctIndex: Number(correctIndex) >= 0 ? Number(correctIndex) : 0,
        explanation: String(explanation || '').trim(),
        updatedAt: new Date()
      };

      await questionsColl.insertOne(newQ);

      // Append to subjects collection
      await subjectsColl.updateOne(
        { id: subjectId },
        {
          $push: {
            questions: {
              id: newId,
              question: newQ.question,
              options: newQ.options,
              correctIndex: newQ.correctIndex,
              explanation: newQ.explanation
            }
          },
          $inc: { totalQuestions: 1 },
          $set: { updatedAt: new Date() }
        }
      );

      return res.status(200).json({
        success: true,
        message: 'Đã thêm câu hỏi mới thành công!',
        question: newQ
      });
    }

    // ACTION 4: DELETE QUESTION
    if (action === 'delete-question') {
      const { subjectId, questionId } = body;
      const qId = Number(questionId);

      await questionsColl.deleteOne({ subjectId, id: qId });
      await subjectsColl.updateOne(
        { id: subjectId },
        {
          $pull: { questions: { id: qId } },
          $inc: { totalQuestions: -1 },
          $set: { updatedAt: new Date() }
        }
      );

      return res.status(200).json({ success: true, message: `Đã xóa câu hỏi ${qId}` });
    }

    // ACTION 5: DELETE SUBJECT
    if (action === 'delete-subject') {
      const { subjectId } = body;
      if (!subjectId) return res.status(400).json({ error: 'Thiếu subjectId' });

      await subjectsColl.deleteOne({ id: subjectId });
      await questionsColl.deleteMany({ subjectId });

      return res.status(200).json({ success: true, message: 'Đã xóa môn học khỏi cơ sở dữ liệu' });
    }

    // ACTION 6: UPDATE SUBJECT NAME & ICON
    if (action === 'update-subject') {
      const { subjectId, title, icon } = body;
      if (!subjectId || !title) {
        return res.status(400).json({ error: 'Thiếu subjectId hoặc tên môn học' });
      }

      const updateData = {
        title: title.trim(),
        updatedAt: new Date()
      };
      if (icon) updateData.icon = icon.trim();

      await subjectsColl.updateOne(
        { id: subjectId },
        { $set: updateData }
      );

      return res.status(200).json({ success: true, message: 'Đã cập nhật tên môn học thành công' });
    }

    // ACTION 7: TOGGLE HIDE/SHOW SUBJECT
    if (action === 'toggle-hide-subject') {
      const { subjectId, hidden } = body;
      if (!subjectId) return res.status(400).json({ error: 'Thiếu subjectId' });

      await subjectsColl.updateOne(
        { id: subjectId },
        { $set: { hidden: !!hidden, updatedAt: new Date() } }
      );

      return res.status(200).json({
        success: true,
        hidden: !!hidden,
        message: hidden ? 'Đã ẩn môn học khỏi màn hình chính' : 'Đã hiện môn học trên màn hình chính'
      });
    }

    return res.status(400).json({ error: `Hành động "${action}" không hợp lệ` });

  } catch (error) {
    console.error('[API Manage Error]:', error);
    return res.status(500).json({ error: 'Lỗi xử lý yêu cầu: ' + error.message });
  }
};
