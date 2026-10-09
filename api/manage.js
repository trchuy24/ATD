const { getDb } = require('../lib/mongodb');

// In-memory rate limiting for brute-force protection: max 3 failed attempts, 2-minute lockout
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MS = 2 * 60 * 1000; // 2 minutes (120,000 ms)
const failedAttempts = new Map();

function getRateLimitStatus(ip) {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record) {
    return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS, remainingSeconds: 0 };
  }

  // Active lockout check
  if (record.lockoutUntil && now < record.lockoutUntil) {
    const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
    return { locked: true, attemptsLeft: 0, remainingSeconds };
  }

  // If lockout has elapsed, reset counter
  if (record.lockoutUntil && now >= record.lockoutUntil) {
    failedAttempts.delete(ip);
    return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS, remainingSeconds: 0 };
  }

  // Auto-expire attempts after 10 minutes of inactivity
  if (now - record.lastAttempt > 10 * 60 * 1000) {
    failedAttempts.delete(ip);
    return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS, remainingSeconds: 0 };
  }

  const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - record.count);
  return { locked: false, attemptsLeft, remainingSeconds: 0 };
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  let record = failedAttempts.get(ip);
  if (!record || (record.lockoutUntil && now >= record.lockoutUntil)) {
    record = { count: 0, lockoutUntil: 0, lastAttempt: now };
  }
  record.count = (record.count || 0) + 1;
  record.lastAttempt = now;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_MS;
    failedAttempts.set(ip, record);
    return { locked: true, remainingSeconds: 120, attemptsLeft: 0 };
  }

  failedAttempts.set(ip, record);
  return { locked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS - record.count };
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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local';
  const limitStatus = getRateLimitStatus(clientIp);

  if (limitStatus.locked) {
    const mins = Math.floor(limitStatus.remainingSeconds / 60);
    const secs = limitStatus.remainingSeconds % 60;
    const timeStr = mins > 0 ? `${mins} phút ${secs < 10 ? '0' : ''}${secs} giây` : `${secs} giây`;
    return res.status(429).json({
      error: `Bạn đã nhập sai mã PIN quá 3 lần. Hệ thống tạm khóa trong ${timeStr}. Vui lòng thử lại sau.`,
      locked: true,
      remainingSeconds: limitStatus.remainingSeconds
    });
  }

  const body = await parseBody(req);
  const action = req.query?.action || body.action;

  // Endpoint to check lock status
  if (action === 'check-lock') {
    return res.status(200).json(limitStatus);
  }

  // Verify PIN
  const adminPinEnv = process.env.ADMIN_PIN || '241199';
  const providedPin = req.headers['x-admin-pin'] || body.adminPin;

  if (!providedPin || String(providedPin).trim() !== String(adminPinEnv).trim()) {
    const failInfo = recordFailedAttempt(clientIp);
    if (failInfo.locked) {
      return res.status(429).json({
        error: 'Bạn đã nhập sai mã PIN 3 lần liên tiếp. Hệ thống đã tạm khóa 2 phút.',
        locked: true,
        remainingSeconds: failInfo.remainingSeconds
      });
    }
    return res.status(401).json({
      error: `Mã PIN không chính xác. Bạn còn ${failInfo.attemptsLeft} lần thử trước khi bị khóa 2 phút.`,
      locked: false,
      attemptsLeft: failInfo.attemptsLeft
    });
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
      const { title, questions: rawQuestions, subjectId: customSubjectId } = body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Tên môn học không được để trống' });
      }

      const questions = normalizeQuestions(rawQuestions);
      if (questions.length === 0) {
        return res.status(400).json({ error: 'Ngân hàng câu hỏi trống hoặc sai định dạng' });
      }

      const baseSlug = customSubjectId ? slugify(customSubjectId) : slugify(title);
      const subjectId = baseSlug || 'mon_' + Date.now();

      const isCns = subjectId.toLowerCase().startsWith('cns') || title.toUpperCase().includes('CNS');
      const parentId = body.parentId !== undefined ? (body.parentId || null) : (isCns ? 'cns' : null);

      const existingSub = await subjectsColl.findOne({ id: subjectId });
      let subjectOrder = existingSub?.order;
      if (typeof subjectOrder !== 'number') {
        const query = parentId ? { parentId } : {};
        const maxOrderSub = await subjectsColl.find(query).sort({ order: -1 }).limit(1).toArray();
        subjectOrder = (maxOrderSub[0]?.order || 0) + 1;
      }

      const subjectData = {
        id: subjectId,
        title: title.trim(),
        subtitle: `Ngân hàng ${questions.length} câu hỏi`,
        isFolder: false,
        parentId: parentId,
        order: subjectOrder,
        totalQuestions: questions.length,
        updatedAt: new Date()
      };

      await subjectsColl.updateOne(
        { id: subjectId },
        {
          $set: subjectData,
          $unset: { questions: "", icon: "", group: "" }
        },
        { upsert: true }
      );

      // Refresh questions collection with parentSubjectID
      await questionsColl.deleteMany({ subjectId });
      const questionDocs = questions.map(q => ({
        subjectId,
        parentSubjectID: parentId || null,
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

      return res.status(200).json({
        success: true,
        message: `Đã cập nhật câu hỏi số ${qId} thành công!`
      });
    }

    // ACTION 3: ADD QUESTION
    if (action === 'add-question') {
      const { subjectId, question, options, correctIndex, explanation } = body;
      if (!subjectId) return res.status(400).json({ error: 'Thiếu subjectId' });

      // Look up parentId of subject to set parentSubjectID
      const subject = await subjectsColl.findOne({ id: subjectId });
      const parentSubjectID = subject?.parentId || null;

      // Determine new question id
      const lastQ = await questionsColl.find({ subjectId }).sort({ id: -1 }).limit(1).toArray();
      const newId = (lastQ.length > 0 ? Number(lastQ[0].id) : 0) + 1;

      const newQ = {
        subjectId,
        parentSubjectID,
        id: newId,
        question: String(question || '').trim(),
        options: options || [],
        correctIndex: Number(correctIndex) >= 0 ? Number(correctIndex) : 0,
        explanation: String(explanation || '').trim(),
        updatedAt: new Date()
      };

      await questionsColl.insertOne(newQ);

      // Increment totalQuestions in subjects collection
      await subjectsColl.updateOne(
        { id: subjectId },
        {
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

    // ACTION 6: UPDATE SUBJECT
    if (action === 'update-subject') {
      const { subjectId, title } = body;
      if (!subjectId || !title) {
        return res.status(400).json({ error: 'Thiếu subjectId hoặc tên môn học' });
      }

      const updateData = {
        title: title.trim(),
        updatedAt: new Date()
      };
      if (body.parentId !== undefined) updateData.parentId = body.parentId || null;

      await subjectsColl.updateOne(
        { id: subjectId },
        {
          $set: updateData,
          $unset: { icon: "", group: "", questions: "" }
        }
      );

      // If parentId is updated, also update parentSubjectID on all questions of this subject
      if (body.parentId !== undefined) {
        await questionsColl.updateMany(
          { subjectId },
          { $set: { parentSubjectID: body.parentId || null } }
        );
      }

      return res.status(200).json({ success: true, message: 'Đã cập nhật môn học thành công' });
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

    // ACTION 8: REORDER SUBJECTS
    if (action === 'reorder-subjects') {
      const { orders } = body;
      if (!Array.isArray(orders)) {
        return res.status(400).json({ error: 'Dữ liệu orders phải là một danh sách' });
      }

      for (const item of orders) {
        if (item.id && typeof item.order === 'number') {
          await subjectsColl.updateOne(
            { id: item.id },
            { $set: { order: item.order, updatedAt: new Date() } }
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Đã cập nhật thứ tự hiển thị môn học'
      });
    }

    // ACTION 9: CREATE FOLDER (TẠO THƯ MỤC CHA)
    if (action === 'create-folder') {
      const { title } = body;
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Tên thư mục cha không được để trống' });
      }

      const folderId = slugify(title) || 'folder_' + Date.now();
      const existing = await subjectsColl.findOne({ id: folderId });
      if (existing) {
        return res.status(400).json({ error: `Thư mục hoặc môn có mã "${folderId}" đã tồn tại` });
      }

      const maxOrderSub = await subjectsColl.find().sort({ order: -1 }).limit(1).toArray();
      const nextOrder = (maxOrderSub[0]?.order || 0) + 1;

      const folderData = {
        id: folderId,
        title: title.trim(),
        isFolder: true,
        parentId: null,
        order: nextOrder,
        totalQuestions: 0,
        updatedAt: new Date()
      };

      await subjectsColl.insertOne(folderData);
      return res.status(200).json({
        success: true,
        folder: folderData,
        message: `Đã tạo thư mục cha "${title.trim()}"`
      });
    }

    // ACTION 10: UPDATE FOLDER (CẬP NHẬT THƯ MỤC CHA)
    if (action === 'update-folder') {
      const { folderId, title } = body;
      if (!folderId || !title) {
        return res.status(400).json({ error: 'Thiếu folderId hoặc tên thư mục' });
      }

      const updateData = { title: title.trim(), updatedAt: new Date() };

      await subjectsColl.updateOne(
        { id: folderId },
        {
          $set: updateData,
          $unset: { icon: "", group: "", questions: "" }
        }
      );
      return res.status(200).json({ success: true, message: 'Đã cập nhật thư mục cha thành công' });
    }

    // ACTION 11: DELETE FOLDER (XÓA THƯ MỤC CHA)
    if (action === 'delete-folder') {
      const { folderId } = body;
      if (!folderId) return res.status(400).json({ error: 'Thiếu folderId' });

      // Move child subjects out to root so they aren't lost
      await subjectsColl.updateMany(
        { parentId: folderId },
        { $set: { parentId: null, updatedAt: new Date() } }
      );

      // Update questions parentSubjectID to null
      await questionsColl.updateMany(
        { parentSubjectID: folderId },
        { $set: { parentSubjectID: null } }
      );

      await subjectsColl.deleteOne({ id: folderId });
      return res.status(200).json({
        success: true,
        message: 'Đã xóa thư mục cha (các môn học con đã được chuyển ra ngoài làm môn độc lập)'
      });
    }

    // ACTION 12: SET SUBJECT PARENT (CHUYỂN MÔN VÀO/RA THƯ MỤC CHA)
    if (action === 'set-subject-parent') {
      const { subjectId, parentId } = body;
      if (!subjectId) return res.status(400).json({ error: 'Thiếu subjectId' });

      await subjectsColl.updateOne(
        { id: subjectId },
        {
          $set: { parentId: parentId || null, updatedAt: new Date() },
          $unset: { group: "" }
        }
      );

      // Also update parentSubjectID on all questions for this subject
      await questionsColl.updateMany(
        { subjectId },
        { $set: { parentSubjectID: parentId || null } }
      );

      return res.status(200).json({
        success: true,
        message: parentId ? `Đã chuyển môn vào thư mục "${parentId}"` : 'Đã chuyển môn thành môn độc lập'
      });
    }

    return res.status(400).json({ error: `Hành động "${action}" không hợp lệ` });

  } catch (error) {
    console.error('[API Manage Error]:', error);
    return res.status(500).json({ error: 'Lỗi xử lý yêu cầu: ' + error.message });
  }
};
