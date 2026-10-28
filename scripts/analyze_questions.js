const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));

console.log('Total questions:', questions.length);

const found = [];
questions.forEach((q, idx) => {
  const fullText = (q.question + ' ' + (q.options ? q.options.map(o => o.text).join(' ') : '') + ' ' + (q.explanation || '')).toLowerCase();
  if (fullText.includes('biển đảo') || fullText.includes('polestar') || fullText.includes('nautel') || fullText.includes('ground plane')) {
    found.push({
      idx,
      subjectId: q.subjectId,
      id: q.id,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex
    });
  }
});

console.log('Found specific matching examples:', found.length);
found.forEach(f => {
  const correctOpt = f.options && f.options[f.correctIndex] ? f.options[f.correctIndex].text : 'N/A';
  console.log(`[${f.subjectId} - #${f.id}] ${f.question}`);
  console.log(` -> Đáp án đúng: ${correctOpt}\n`);
});
