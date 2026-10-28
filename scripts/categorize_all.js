const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));

// Categorize questions
const categories = {
  thoai: { title: '1. Hệ thống Thoại VHF Hàng không & Kỹ thuật Anten', items: [] },
  duong_truyen: { title: '2. Đường truyền dẫn, Giao thức & Cáp mạng Viễn thông', items: [] },
  pbn: { title: '3. Dẫn đường theo tính năng thiết bị (PBN / RNAV / RNP)', items: [] },
  ndb: { title: '4. Hệ thống dẫn đường vô tuyến mặt đất sóng Trung – NDB', items: [] },
  df_papi: { title: '5. Hệ thống tìm phương (DF) & Đèn hỗ trợ tiếp cận (PAPI / Đèn sân bay)', items: [] },
  vor: { title: '6. Hệ thống đài dẫn đường đa hướng sóng cực ngắn – VOR (CVOR & DVOR)', items: [] },
  dme: { title: '7. Thiết bị đo cự ly hàng không – DME', items: [] },
  ils: { title: '8. Hệ thống hạ cánh chính xác bằng thiết bị – ILS (LLZ, GP, Marker)', items: [] },
  gnss: { title: '9. Hệ thống vệ tinh dẫn đường toàn cầu – GNSS (GPS, GLONASS, GALILEO, SBAS/GBAS)', items: [] },
  avionics: { title: '10. Thiết bị điện tử & Dẫn đường trên tàu bay (Avionics: FMS, PFD, WXR, RA, INS/IRS)', items: [] }
};

// Map each question to a category
questions.forEach(q => {
  const sid = q.subjectId;
  const qText = q.question.toLowerCase();
  const correctOpt = q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].text : '';
  const fullText = (q.question + ' ' + (q.options ? q.options.map(o => o.text).join(' ') : '')).toLowerCase();

  let catKey = null;

  if (sid === 'cns_p2_mon_1_thoai') {
    catKey = 'thoai';
  } else if (sid === 'cns_p2_mon_2_duong_truyen') {
    catKey = 'duong_truyen';
  } else if (sid === 'cns_p2_mon_3_dan_duong_dua_vao_tinh_nang_thiet_bi_tren_tau_bay') {
    catKey = 'pbn';
  } else if (sid === 'cns_p2_mon_4_ndb') {
    catKey = 'ndb';
  } else if (sid === 'cns_p2_m5_dan_duong_tren_mat_dat_df') {
    catKey = 'df_papi';
  } else if (sid === 'cns_p2_mon_6_vor') {
    catKey = 'vor';
  } else if (sid === 'cns_mon_dme') {
    catKey = 'dme';
  } else if (sid === 'cns_p2_m8_ils') {
    catKey = 'ils';
  } else if (sid === 'cns_p2_m10_thiet_bi_tren_tau_bay') {
    catKey = 'avionics';
  } else if (sid === 'cns_tong_hop_thi') {
    // Map based on question ID or content
    if (q.id >= 1 && q.id <= 30) {
      catKey = 'thoai';
    } else if (q.id >= 31 && q.id <= 55) {
      catKey = 'duong_truyen';
    } else if (q.id >= 56 && q.id <= 85) {
      catKey = 'pbn';
    } else if (q.id >= 86 && q.id <= 120) {
      catKey = 'ndb';
    } else if (q.id >= 121 && q.id <= 155) {
      catKey = 'df_papi';
    } else if (q.id >= 156 && q.id <= 195) {
      catKey = 'vor';
    } else if (q.id >= 196 && q.id <= 230) {
      catKey = 'ils';
    } else if (q.id >= 231 && q.id <= 262) {
      catKey = 'dme';
    } else if (q.id >= 263 && q.id <= 304) {
      catKey = 'gnss';
    } else if (q.id >= 305 && q.id <= 346) {
      catKey = 'avionics';
    }
  }

  if (catKey && categories[catKey]) {
    categories[catKey].items.push(q);
  }
});

for (let k in categories) {
  console.log(`${categories[k].title}: ${categories[k].items.length} questions`);
}
