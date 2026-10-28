const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));

// Regex to detect numbers and units
const numberRegex = /\b\d+(?:[\.,]\d+)?\s*(?:hz|khz|mhz|ghz|w|kw|mw|db|dbm|nm|km|m|cm|mm|ft|feet|µs|us|ms|s|giây|phút|giờ|hour|hours|deg|độ|%|bps|kbps|mbps|baud|knot|knots|ppm|v|mv|kv|a|ma|ohm|kohm|bit|byte|vệ tinh|kênh|tia|tầng|năm|tháng|ngày)\b/i;
const digitRegex = /\d+/;

const subjectsMap = {
  'cns_p2_mon_1_thoai': 'Môn 1: Thoại',
  'cns_p2_mon_2_duong_truyen': 'Môn 2: Đường truyền',
  'cns_p2_mon_3_dan_duong_dua_vao_tinh_nang_thiet_bi_tren_tau_bay': 'Môn 3: Dẫn đường dựa vào tính năng thiết bị trên tàu bay (PBN/RNAV/RNP)',
  'cns_p2_mon_4_ndb': 'Môn 4: Hệ thống trên mặt đất – NDB',
  'cns_p2_m5_dan_duong_tren_mat_dat_df': 'Môn 5: Hệ thống dẫn đường trên mặt đất (DF)',
  'cns_p2_mon_6_vor': 'Môn 6: Hệ thống dẫn đường trên mặt đất – VOR',
  'cns_mon_dme': 'Môn 7: DME',
  'cns_p2_m8_ils': 'Môn 8: Hệ thống dẫn đường trên mặt đất – ILS',
  'cns_p2_mon_9_gnss': 'Môn 9: GNSS',
  'cns_p2_m10_thiet_bi_tren_tau_bay': 'Môn 10: Thiết bị trên tàu bay',
  'cns_tong_hop_thi': 'CNS - Tổng hợp thi'
};

const results = [];

questions.forEach((q, idx) => {
  const qText = q.question || '';
  const correctOpt = q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].text : '';
  const allOpts = q.options ? q.options.map(o => o.text).join(' ') : '';
  const expl = q.explanation || '';
  const combined = qText + ' ' + correctOpt + ' ' + allOpts;

  // Check if question or correct answer contains numerical data, quantities, specs
  const hasUnit = numberRegex.test(combined);
  const hasDigitInAns = digitRegex.test(correctOpt);
  const hasDigitInQ = digitRegex.test(qText);
  const hasKeywords = /(bao nhiêu|tần số|công suất|cự ly|tầm phủ|khoảng cách|độ cao|góc|độ rộng|chu kỳ|thời gian|sai số|bước sóng|suy hao|độ lợi|dung sai|vận tốc|tốc độ|kích thước|số lượng|số kênh|số tia|số trạm|số bit)/i.test(qText);

  const isNumerical = hasUnit || (hasKeywords && (hasDigitInAns || hasDigitInQ)) || (hasDigitInAns && !/^[A-D]\.?$/.test(correctOpt));

  if (isNumerical) {
    results.push({
      subjectId: q.subjectId,
      subjectName: subjectsMap[q.subjectId] || q.subjectId,
      originalId: q.id,
      question: qText.trim(),
      correctAnswer: correctOpt.trim(),
      options: q.options || [],
      explanation: expl.trim()
    });
  }
});

console.log('Total analyzed:', questions.length);
console.log('Total numerical/spec questions identified:', results.length);

const bySubject = {};
results.forEach(r => {
  bySubject[r.subjectId] = (bySubject[r.subjectId] || 0) + 1;
});
console.log('Identified by subject:', bySubject);

fs.writeFileSync('scripts/numerical_questions.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Saved to scripts/numerical_questions.json');
