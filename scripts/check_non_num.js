const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));

// Run test_dedup logic
function getUniqueQuestions(qList) {
  const map = new Map();
  qList.forEach(q => {
    const key = q.question.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!map.has(key)) map.set(key, q);
  });
  return Array.from(map.values());
}

function isNumericalQuestion(q) {
  const fullText = (q.question + ' ' + (q.options ? q.options.map(o => o.text).join(' ') : '')).toLowerCase();
  const correctOpt = q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].text : '';

  const hasDigitInQ = /\d/.test(q.question);
  const hasDigitInAns = /\d/.test(correctOpt);
  const hasUnit = /\b(hz|khz|mhz|ghz|db|dbm|w|kw|mw|nm|km|m|cm|mm|ft|feet|dặm|µs|us|ms|s|giây|phút|giờ|hour|deg|độ|%|bps|kbps|mbps|baud|knot|knots|ppm|v|mv|kv|a|ma|ohm|kohm|bit|byte|vệ tinh|kênh|tia|tầng|năm|tháng|ngày)\b/i.test(fullText);
  const hasNumKeyword = /(bao nhiêu|tần số|công suất|cự ly|tầm phủ|khoảng cách|độ cao|góc|độ rộng|chu kỳ|thời gian|sai số|bước sóng|suy hao|độ lợi|dung sai|vận tốc|tốc độ|kích thước|số lượng|số kênh|số tia|số trạm|số bit|ngưỡng|giới hạn)/i.test(q.question);

  if (/(trắng|đỏ)/i.test(correctOpt) && /papi/i.test(q.question)) return true;
  if (/polestar/i.test(q.question)) return true;
  if (hasUnit) return true;
  if (hasDigitInAns && !/^[a-d]\.?$/i.test(correctOpt)) return true;
  if (hasNumKeyword && (hasDigitInQ || hasDigitInAns)) return true;
  if (/(rnav|rnp)\s*\d+/i.test(fullText)) return true;

  return false;
}

const unique = getUniqueQuestions(questions);
const nonNum = unique.filter(q => !isNumericalQuestion(q));
console.log('Non-numerical count:', nonNum.length);
nonNum.forEach(q => {
  const ans = q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].text : '';
  console.log(`[${q.subjectId} #${q.id}] ${q.question} -> ${ans}`);
});
