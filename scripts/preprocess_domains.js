const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));

// Helper to clean and normalize text
function cleanText(t) {
  if (!t) return '';
  return t.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Group into the 10 defined domains
const domainDefs = [
  {
    id: 'thoai',
    code: 'CNS-THOAI',
    name: 'Hệ thống Thoại VHF Hàng không & Kỹ thuật Anten',
    match: q => q.subjectId === 'cns_p2_mon_1_thoai' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 1 && q.id <= 30)
  },
  {
    id: 'duong_truyen',
    code: 'CNS-DUONGTRUYEN',
    name: 'Đường truyền dẫn, Giao thức & Cáp mạng Viễn thông',
    match: q => q.subjectId === 'cns_p2_mon_2_duong_truyen' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 31 && q.id <= 55)
  },
  {
    id: 'pbn',
    code: 'CNS-PBN',
    name: 'Dẫn đường theo tính năng thiết bị (PBN / RNAV / RNP)',
    match: q => q.subjectId === 'cns_p2_mon_3_dan_duong_dua_vao_tinh_nang_thiet_bi_tren_tau_bay' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 56 && q.id <= 85)
  },
  {
    id: 'ndb',
    code: 'CNS-NDB',
    name: 'Hệ thống dẫn đường vô tuyến mặt đất sóng Trung – NDB',
    match: q => q.subjectId === 'cns_p2_mon_4_ndb' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 86 && q.id <= 120)
  },
  {
    id: 'df_papi',
    code: 'CNS-DF-PAPI',
    name: 'Hệ thống tìm phương (DF) & Đèn hỗ trợ tiếp cận (PAPI / Đèn sân bay)',
    match: q => q.subjectId === 'cns_p2_m5_dan_duong_tren_mat_dat_df' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 121 && q.id <= 155)
  },
  {
    id: 'vor',
    code: 'CNS-VOR',
    name: 'Hệ thống đài dẫn đường đa hướng sóng cực ngắn – VOR (CVOR & DVOR)',
    match: q => q.subjectId === 'cns_p2_mon_6_vor' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 156 && q.id <= 195)
  },
  {
    id: 'dme',
    code: 'CNS-DME',
    name: 'Thiết bị đo cự ly hàng không – DME',
    match: q => q.subjectId === 'cns_mon_dme' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 231 && q.id <= 262)
  },
  {
    id: 'ils',
    code: 'CNS-ILS',
    name: 'Hệ thống hạ cánh chính xác bằng thiết bị – ILS (LLZ, GP, Marker)',
    match: q => q.subjectId === 'cns_p2_m8_ils' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 196 && q.id <= 230)
  },
  {
    id: 'gnss',
    code: 'CNS-GNSS',
    name: 'Hệ thống vệ tinh dẫn đường toàn cầu – GNSS (GPS, GLONASS, GALILEO, SBAS/GBAS)',
    match: q => q.subjectId === 'cns_tong_hop_thi' && q.id >= 263 && q.id <= 304
  },
  {
    id: 'avionics',
    code: 'CNS-AVIONICS',
    name: 'Thiết bị điện tử & Dẫn đường trên tàu bay (Avionics: FMS, PFD, WXR, RA, INS/IRS)',
    match: q => q.subjectId === 'cns_p2_m10_thiet_bi_tren_tau_bay' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 305 && q.id <= 346)
  }
];

const processedDomains = domainDefs.map(dom => {
  const list = questions.filter(dom.match);
  // Deduplicate by question text
  const map = new Map();
  list.forEach(q => {
    const key = cleanText(q.question).toLowerCase();
    const correctOpt = q.options && q.options[q.correctIndex] ? cleanText(q.options[q.correctIndex].text) : '';
    const item = {
      originalId: q.id,
      subjectId: q.subjectId,
      question: cleanText(q.question),
      options: (q.options || []).map(o => ({ label: o.label, text: cleanText(o.text) })),
      correctIndex: q.correctIndex,
      correctAnswer: correctOpt,
      explanation: cleanText(q.explanation || '')
    };
    if (!map.has(key)) {
      map.set(key, item);
    } else {
      const existing = map.get(key);
      if (!existing.explanation && item.explanation) {
        map.set(key, item);
      }
    }
  });

  const uniqueItems = Array.from(map.values());
  return {
    ...dom,
    rawCount: list.length,
    uniqueCount: uniqueItems.length,
    questions: uniqueItems
  };
});

fs.writeFileSync('scripts/domain_questions_processed.json', JSON.stringify(processedDomains, null, 2), 'utf8');
console.log('Domain processing complete. Summary:');
processedDomains.forEach(d => {
  console.log(`- ${d.name}: Raw = ${d.rawCount}, Unique = ${d.uniqueCount}`);
});
