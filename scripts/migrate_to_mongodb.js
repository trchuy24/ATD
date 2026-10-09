const fs = require('fs');
const path = require('path');
const { getDb, clientPromise } = require('../lib/mongodb');

const BASE_DIR = path.resolve(__dirname, '..');

async function migrate() {
  console.log('--- Bắt đầu di chuyển dữ liệu câu hỏi vào MongoDB Atlas ---');

  const db = await getDb();
  const subjectsColl = db.collection('subjects');
  const questionsColl = db.collection('questions');

  // Create indexes
  await subjectsColl.createIndex({ id: 1 }, { unique: true });
  await subjectsColl.createIndex({ order: 1 });
  await questionsColl.createIndex({ subjectId: 1, id: 1 }, { unique: true });

  const subjectsToMigrate = [];

  // 1. An Toàn Điện - Bậc 3 (questions.json)
  const atdPath = path.join(BASE_DIR, 'questions.json');
  if (fs.existsSync(atdPath)) {
    const atdQuestions = JSON.parse(fs.readFileSync(atdPath, 'utf8')).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options || [],
      correctIndex: q.correctIndex,
      explanation: q.explanation || ''
    }));
    subjectsToMigrate.push({
      id: 'atd',
      title: 'An Toàn Điện - Bậc 3',
      subtitle: `Ngân hàng ${atdQuestions.length} câu hỏi`,
      icon: '⚡',
      order: 1,
      questions: atdQuestions
    });
  }

  // 2. CNS - Môn 1 (questions_cns1.json)
  const cns1Path = path.join(BASE_DIR, 'questions_cns1.json');
  if (fs.existsSync(cns1Path)) {
    const cns1Questions = JSON.parse(fs.readFileSync(cns1Path, 'utf8')).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options || [],
      correctIndex: q.correctIndex,
      explanation: q.explanation || ''
    }));
    subjectsToMigrate.push({
      id: 'cns1',
      title: 'CNS - Môn 1',
      subtitle: `Ngân hàng ${cns1Questions.length} câu hỏi`,
      icon: '✈️',
      order: 2,
      questions: cns1Questions
    });
  }

  // 3. CNS - Thông tin (questions_cns_thongtin.json)
  const cnsTtPath = path.join(BASE_DIR, 'questions_cns_thongtin.json');
  if (fs.existsSync(cnsTtPath)) {
    const rawData = JSON.parse(fs.readFileSync(cnsTtPath, 'utf8'));
    const cnsTtQuestions = rawData.map(item => {
      const options = [];
      const optsObj = item.cac_lua_chon || {};
      const targetAns = (item.dap_an || '').toLowerCase().trim();
      let correctIdx = -1;
      let idx = 0;
      for (const [lbl, txt] of Object.entries(optsObj)) {
        options.push({ label: lbl, text: txt });
        if (lbl.toLowerCase().trim() === targetAns) {
          correctIdx = idx;
        }
        idx++;
      }
      return {
        id: item.cau_so || 0,
        question: item.cau_hoi || '',
        options: options,
        correctIndex: correctIdx,
        explanation: item.giai_thich || ''
      };
    });

    subjectsToMigrate.push({
      id: 'cns_thongtin',
      title: 'CNS - Thông tin',
      subtitle: `Ngân hàng ${cnsTtQuestions.length} câu hỏi`,
      icon: '✈️',
      order: 3,
      questions: cnsTtQuestions
    });
  }

  let totalQuestionsCount = 0;

  for (const sub of subjectsToMigrate) {
    console.log(`Đang lưu môn: "${sub.title}" (${sub.id}) - ${sub.questions.length} câu hỏi...`);

    // Upsert into subjects collection (omitting questions, icon, group)
    const isCns = sub.id.startsWith('cns') && sub.id !== 'cns';
    const parentId = isCns ? 'cns' : null;

    await subjectsColl.updateOne(
      { id: sub.id },
      {
        $set: {
          id: sub.id,
          title: sub.title,
          subtitle: sub.subtitle,
          order: sub.order,
          parentId: parentId,
          isFolder: false,
          totalQuestions: sub.questions.length,
          updatedAt: new Date()
        },
        $unset: {
          questions: "",
          icon: "",
          group: ""
        }
      },
      { upsert: true }
    );

    // Upsert each question into questions collection with parentSubjectID
    for (const q of sub.questions) {
      await questionsColl.updateOne(
        { subjectId: sub.id, id: q.id },
        {
          $set: {
            subjectId: sub.id,
            parentSubjectID: parentId,
            id: q.id,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      totalQuestionsCount++;
    }
  }

  console.log(`✅ Hoàn thành di chuyển: ${subjectsToMigrate.length} môn học, tổng cộng ${totalQuestionsCount} câu hỏi đã được lưu vào MongoDB Atlas!`);

  const client = await clientPromise;
  await client.close();
}

migrate().catch(err => {
  console.error('❌ Lỗi di chuyển dữ liệu:', err);
  process.exit(1);
});
