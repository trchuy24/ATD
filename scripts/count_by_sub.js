const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));

console.log('Total targeted questions:', questions.length);

// Let's inspect the questions by subject
const subGroups = {};
questions.forEach(q => {
  if (!subGroups[q.subjectId]) subGroups[q.subjectId] = [];
  subGroups[q.subjectId].push(q);
});

for (let s in subGroups) {
  console.log(`${s}: ${subGroups[s].length} questions`);
}
