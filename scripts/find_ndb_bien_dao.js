const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('scripts/target_cns_questions.json', 'utf8'));

// Also check all_cns_questions.json in case it's in another subject
const allQuestions = JSON.parse(fs.readFileSync('scripts/all_cns_questions.json', 'utf8')).questions;

console.log('Searching across target questions (' + questions.length + ') and all questions (' + allQuestions.length + ')...');

function search(arr, label) {
  console.log(`=== Searching in ${label} ===`);
  arr.forEach(q => {
    const text = (q.question + ' ' + (q.options ? q.options.map(o => o.text).join(' ') : '') + ' ' + (q.explanation || '')).toLowerCase();
    if (text.includes('biển') || text.includes('đảo') || (text.includes('tần số') && text.includes('ndb'))) {
      const ans = q.options && q.options[q.correctIndex] ? q.options[q.correctIndex].text : 'N/A';
      console.log(`[${q.subjectId} #${q.id}] Q: ${q.question}`);
      console.log(` -> Ans: ${ans}`);
      if (q.options) {
        console.log('    Options: ' + q.options.map(o => o.label + ': ' + o.text).join(' | '));
      }
    }
  });
}

search(questions, 'Target questions');
search(allQuestions.filter(q => !questions.some(t => t._id === q._id)), 'Other subjects in all_cns_questions.json');
