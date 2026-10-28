const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));

// Deduplicate questions by question text normalized
function getUniqueQuestions(qList) {
  const map = new Map();
  qList.forEach(q => {
    const key = q.question.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!map.has(key)) {
      map.set(key, q);
    } else {
      // If one has explanation and other doesn't, keep the richer one
      const existing = map.get(key);
      if (!existing.explanation && q.explanation) {
        map.set(key, q);
      }
    }
  });
  return Array.from(map.values());
}

// Check if a question is numerical or contains specific technical specifications
function isNumericalQuestion(q) {
  const fullText = (q.question + ' ' + (q.options ? q.options.map(o => o.text).join(' ') : '')).toLowerCase();
  const correctOpt = q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].text : '';

  // Digit in question or options
  const hasDigitInQ = /\d/.test(q.question);
  const hasDigitInAns = /\d/.test(correctOpt);
  const hasUnit = /\b(hz|khz|mhz|ghz|db|dbm|w|kw|mw|nm|km|m|cm|mm|ft|feet|dặm|µs|us|ms|s|giây|phút|giờ|hour|deg|độ|%|bps|kbps|mbps|baud|knot|knots|ppm|v|mv|kv|a|ma|ohm|kohm|bit|byte|vệ tinh|kênh|tia|tầng|năm|tháng|ngày)\b/i.test(fullText);
  const hasNumKeyword = /(bao nhiêu|tần số|công suất|cự ly|tầm phủ|khoảng cách|độ cao|góc|độ rộng|chu kỳ|thời gian|sai số|bước sóng|suy hao|độ lợi|dung sai|vận tốc|tốc độ|kích thước|số lượng|số kênh|số tia|số trạm|số bit|ngưỡng|giới hạn)/i.test(q.question);

  // Special checks: PAPI lights (2 trắng 2 đỏ), Mode X/Y, RNP/RNAV standards, etc.
  if (/(trắng|đỏ)/i.test(correctOpt) && /papi/i.test(q.question)) return true;
  if (/polestar/i.test(q.question)) return true;
  if (hasUnit) return true;
  if (hasDigitInAns && !/^[a-d]\.?$/i.test(correctOpt)) return true;
  if (hasNumKeyword && (hasDigitInQ || hasDigitInAns)) return true;
  if (/(rnav|rnp)\s*\d+/i.test(fullText)) return true;

  return false;
}

// Let's test on each category
const categories = {
  thoai: { name: 'Thoại VHF', filter: q => q.subjectId === 'cns_p2_mon_1_thoai' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 1 && q.id <= 30) },
  duong_truyen: { name: 'Đường truyền & Giao thức', filter: q => q.subjectId === 'cns_p2_mon_2_duong_truyen' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 31 && q.id <= 55) },
  pbn: { name: 'PBN / RNAV / RNP', filter: q => q.subjectId === 'cns_p2_mon_3_dan_duong_dua_vao_tinh_nang_thiet_bi_tren_tau_bay' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 56 && q.id <= 85) },
  ndb: { name: 'NDB', filter: q => q.subjectId === 'cns_p2_mon_4_ndb' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 86 && q.id <= 120) },
  df_papi: { name: 'DF & PAPI', filter: q => q.subjectId === 'cns_p2_m5_dan_duong_tren_mat_dat_df' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 121 && q.id <= 155) },
  vor: { name: 'VOR (CVOR & DVOR)', filter: q => q.subjectId === 'cns_p2_mon_6_vor' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 156 && q.id <= 195) },
  dme: { name: 'DME', filter: q => q.subjectId === 'cns_mon_dme' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 231 && q.id <= 262) },
  ils: { name: 'ILS', filter: q => q.subjectId === 'cns_p2_m8_ils' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 196 && q.id <= 230) },
  gnss: { name: 'GNSS (GPS, GLONASS, GALILEO)', filter: q => (q.subjectId === 'cns_tong_hop_thi' && q.id >= 263 && q.id <= 304) },
  avionics: { name: 'Thiết bị trên tàu bay (Avionics)', filter: q => q.subjectId === 'cns_p2_m10_thiet_bi_tren_tau_bay' || (q.subjectId === 'cns_tong_hop_thi' && q.id >= 305 && q.id <= 346) }
};

let totalUnique = 0;
let totalNumerical = 0;

for (let key in categories) {
  const cat = categories[key];
  const list = questions.filter(cat.filter);
  const unique = getUniqueQuestions(list);
  const numerical = unique.filter(isNumericalQuestion);
  totalUnique += unique.length;
  totalNumerical += numerical.length;
  console.log(`[${cat.name}] Total: ${list.length} | Unique: ${unique.length} | Numerical: ${numerical.length}`);
}

console.log(`\nGRAND TOTAL -> Unique: ${totalUnique} | Numerical: ${totalNumerical}`);
