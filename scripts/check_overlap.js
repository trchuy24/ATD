const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));

// Find exact or near duplicate questions between individual subjects and cns_tong_hop_thi
const normalized = questions.map(q => {
  const normQ = q.question.replace(/\s+/g, ' ').trim().toLowerCase();
  const correctOpt = q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].text : '';
  return {
    ...q,
    normQ,
    correctOpt
  };
});

console.log('Total questions:', normalized.length);

// Let's inspect all questions in cns_tong_hop_thi to see how many match individual subjects
const p2Questions = normalized.filter(q => q.subjectId !== 'cns_tong_hop_thi');
const thQuestions = normalized.filter(q => q.subjectId === 'cns_tong_hop_thi');

console.log('P2 individual questions:', p2Questions.length);
console.log('Tổng hợp thi questions:', thQuestions.length);

// Check questions in Tổng hợp thi that are NOT in P2
const p2Map = new Map();
p2Questions.forEach(q => {
  // Key by first 30 chars
  p2Map.set(q.normQ.substring(0, 40), q);
});

let inP2Count = 0;
let notInP2Count = 0;
const novelInTH = [];

thQuestions.forEach(q => {
  const key = q.normQ.substring(0, 40);
  if (p2Map.has(key)) {
    inP2Count++;
  } else {
    notInP2Count++;
    novelInTH.push(q);
  }
});

console.log(`Tong hop thi: ${inP2Count} match P2 subjects, ${notInP2Count} not found in P2 subjects.`);

console.log('\nSample novel questions in Tong hop thi:');
novelInTH.slice(0, 15).forEach(q => {
  console.log(`[#${q.id}] ${q.question} => ${q.correctOpt}`);
});
