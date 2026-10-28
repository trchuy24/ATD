const fs = require('fs');
const all = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));

const noDigits = all.filter(q => {
  const full = q.question + ' ' + (q.options ? q.options.map(o => o.text).join(' ') : '');
  return !/\d/.test(full);
});

console.log('No digits count:', noDigits.length);
// Check if any mention numerical keywords: tần số, cự ly, góc, công suất, khoảng cách, bước sóng, suy hao
const interesting = noDigits.filter(q => {
  const full = q.question + ' ' + (q.options ? q.options.map(o => o.text).join(' ') : '');
  return /(tần số|cự ly|khoảng cách|công suất|góc|bước sóng|suy hao|độ lệch|độ sâu|băng thông|dải tần)/i.test(full);
});

console.log('No digits but with keywords:', interesting.length);
interesting.forEach(q => {
  const ans = q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].text : '';
  console.log(`[${q.subjectId} #${q.id}] ${q.question} -> ${ans}`);
});
