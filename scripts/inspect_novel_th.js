const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));
const p2Questions = questions.filter(q => q.subjectId !== 'cns_tong_hop_thi');
const thQuestions = questions.filter(q => q.subjectId === 'cns_tong_hop_thi');

const p2Keys = new Set(p2Questions.map(q => q.question.replace(/\s+/g, ' ').trim().toLowerCase().substring(0, 40)));

const novel = thQuestions.filter(q => !p2Keys.has(q.question.replace(/\s+/g, ' ').trim().toLowerCase().substring(0, 40)));

console.log('Novel questions in CNS Tổng hợp thi:', novel.length);
novel.forEach((q, idx) => {
  const ans = q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].text : 'N/A';
  console.log(`${idx + 1}. [#${q.id}] ${q.question} -> ${ans}`);
});
