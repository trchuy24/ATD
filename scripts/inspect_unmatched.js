const fs = require('fs');
const all = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));
const matched = JSON.parse(fs.readFileSync('scripts/numerical_questions.json', 'utf8'));
const matchedIds = new Set(matched.map(m => m.subjectId + '_' + m.originalId));

const unmatched = all.filter(q => !matchedIds.has(q.subjectId + '_' + q.id));
console.log('Unmatched count:', unmatched.length);

const samples = [];
unmatched.forEach(q => {
  const ans = q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].text : '';
  const hasDigitInAns = /\d/.test(ans);
  const full = q.question + ' ' + (q.options ? q.options.map(o => o.text).join(' ') : '');
  const hasDigit = /\d/.test(full);
  if (hasDigit) {
    samples.push({
      sub: q.subjectId,
      id: q.id,
      q: q.question,
      ans: ans,
      hasDigitInAns
    });
  }
});

console.log('Unmatched with any digits:', samples.length);
console.log('Sample 30 with digits:');
samples.slice(0, 30).forEach(s => {
  console.log(`[${s.sub} #${s.id}] Q: ${s.q} | Ans: ${s.ans}`);
});
