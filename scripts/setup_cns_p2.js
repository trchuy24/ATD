require('dotenv').config();
const { MongoClient } = require('mongodb');

const P2_SUBJECTS = [
  {
    id: 'cns_p2_mon_1_thoai',
    title: 'P2 - Môn 1: Thoại',
    order: 1
  },
  {
    id: 'cns_p2_mon_2_duong_truyen',
    title: 'P2- Môn 2: Đường truyền',
    order: 2
  },
  {
    id: 'cns_p2_mon_3_dan_duong_dua_vao_tinh_nang_thiet_bi_tren_tau_bay',
    title: 'P2 - Môn 3: Dẫn đường dựa vào tính năng thiết bị trên tàu bay',
    order: 3
  },
  {
    id: 'cns_p2_mon_4_ndb',
    title: 'P2 - Môn 4: Hệ thống trên mặt đất – NDB',
    order: 4
  },
  {
    id: 'cns_p2_m5_dan_duong_tren_mat_dat_df',
    title: 'P2 - Môn 5: Hệ thống dẫn đường trên mặt đất (DF)',
    order: 5
  },
  {
    id: 'cns_p2_mon_6_vor',
    title: 'P2 - Môn 6: Hệ thống dẫn đường trên mặt đất – VOR',
    order: 6
  },
  {
    id: 'cns_mon_dme',
    title: 'P2 - Môn 7: DME',
    order: 7
  },
  {
    id: 'cns_p2_m8_ils',
    title: 'P2 - Môn 8: Hệ thống dẫn đường trên mặt đất – ILS',
    order: 8
  },
  {
    id: 'cns_p2_mon_9_gnss',
    title: 'P2 - Môn 9: GNSS',
    order: 9
  },
  {
    id: 'cns_p2_m10_thiet_bi_tren_tau_bay',
    title: 'P2 - Môn 10: Thiết bị trên tàu bay',
    order: 10
  }
];

const P2_IDS = P2_SUBJECTS.map(s => s.id);

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('trac_nghiem');
  const subjectsColl = db.collection('subjects');
  const questionsColl = db.collection('questions');

  console.log('--- 1. CẬP NHẬT THƯ MỤC CNS VÀ CNS PHẦN 1 ---');

  // Đảm bảo thư mục CNS có parentId: null, isFolder: true, order: 1
  await subjectsColl.updateOne(
    { id: 'cns' },
    {
      $set: {
        id: 'cns',
        title: 'CNS - Dẫn Đường Hàng Không',
        parentId: null,
        isFolder: true,
        order: 1,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  // Tạo thư mục CNS - Phần 1 để lưu giữ an toàn các môn cũ (không làm mất dữ liệu)
  await subjectsColl.updateOne(
    { id: 'cns_p1' },
    {
      $set: {
        id: 'cns_p1',
        title: 'CNS - Phần 1',
        parentId: null,
        isFolder: true,
        order: 99,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  // Chuyển các môn cũ đang nằm trong 'cns' sang 'cns_p1'
  const oldSubjects = await subjectsColl.find({
    parentId: 'cns',
    id: { $nin: P2_IDS }
  }).toArray();

  for (const oldSub of oldSubjects) {
    console.log(`Chuyển môn cũ sang CNS - Phần 1: [${oldSub.id}] ${oldSub.title}`);
    await subjectsColl.updateOne(
      { id: oldSub.id },
      { $set: { parentId: 'cns_p1', updatedAt: new Date() } }
    );
    await questionsColl.updateMany(
      { subjectId: oldSub.id },
      { $set: { parentSubjectID: 'cns_p1' } }
    );
  }

  // Chuyển cns_mon_10_14 (nếu đang ở root) sang cns_p1
  await subjectsColl.updateOne(
    { id: 'cns_mon_10_14' },
    { $set: { parentId: 'cns_p1', updatedAt: new Date() } }
  );
  await questionsColl.updateMany(
    { subjectId: 'cns_mon_10_14' },
    { $set: { parentSubjectID: 'cns_p1' } }
  );

  console.log('\n--- 2. THIẾT LẬP 10 MÔN P2 TRONG THƯ MỤC CNS ---');

  for (const p2 of P2_SUBJECTS) {
    const qCount = await questionsColl.countDocuments({ subjectId: p2.id });
    console.log(`Thiết lập môn P2 [${p2.id}]: "${p2.title}" (Thứ tự: ${p2.order}, Số câu: ${qCount})`);

    await subjectsColl.updateOne(
      { id: p2.id },
      {
        $set: {
          id: p2.id,
          title: p2.title,
          parentId: 'cns',
          order: p2.order,
          isFolder: false,
          totalQuestions: qCount,
          subtitle: `Ngân hàng ${qCount} câu hỏi`,
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

    // Cập nhật parentSubjectID cho tất cả câu hỏi của môn này thành 'cns'
    if (qCount > 0) {
      await questionsColl.updateMany(
        { subjectId: p2.id },
        { $set: { parentSubjectID: 'cns' } }
      );
    }
  }

  console.log('\n--- 3. KIỂM TRA LẠI CÁC PHÂN MÔN TRONG THƯ MỤC CNS ---');
  const cnsChildren = await subjectsColl.find({ parentId: 'cns' }).sort({ order: 1 }).toArray();
  let totalP2Questions = 0;
  for (const ch of cnsChildren) {
    const count = await questionsColl.countDocuments({ subjectId: ch.id });
    totalP2Questions += count;
    console.log(`[Thứ tự ${ch.order}] ${ch.title} (id: ${ch.id}) -> ${count} câu`);
  }
  console.log(`=> Tổng số câu hỏi môn CNS: ${totalP2Questions} câu.`);

  // Cập nhật subtitle cho thư mục CNS
  await subjectsColl.updateOne(
    { id: 'cns' },
    {
      $set: {
        subtitle: `${cnsChildren.length} phân môn • ${totalP2Questions} câu hỏi`,
        totalQuestions: totalP2Questions
      }
    }
  );

  await client.close();
  console.log('\nHoàn thành thiết lập môn CNS!');
}

run().catch(err => {
  console.error('Lỗi thiết lập:', err);
  process.exit(1);
});
