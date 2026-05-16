const fs = require('fs');
const path = require('path');

const questionsFile = path.join(__dirname, '..', 'backend', 'prisma', 'questions_200.json');

function validate() {
  if (!fs.existsSync(questionsFile)) {
    console.error(`File not found: ${questionsFile}`);
    process.exit(1);
  }

  const questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
  const total = questions.length;
  let validCount = 0;
  const errors = [];
  const texts = new Set();
  let duplicates = 0;

  questions.forEach((q, index) => {
    const qErrors = [];
    
    // Check text
    if (!q.textAz || q.textAz.trim().length === 0) {
      qErrors.push('Missing textAz');
    } else if (texts.has(q.textAz)) {
      duplicates++;
      qErrors.push(`Duplicate text: ${q.textAz.substring(0, 30)}...`);
    } else {
      texts.add(q.textAz);
    }

    // Check options
    if (!q.options || typeof q.options !== 'object') {
      qErrors.push('Missing options object');
    } else {
      ['a', 'b', 'c', 'd'].forEach(opt => {
        if (!q.options[opt] || q.options[opt].trim().length === 0) {
          qErrors.push(`Missing option ${opt}`);
        }
      });
    }

    // Check correctOption
    if (!['a', 'b', 'c', 'd'].includes(q.correctOption)) {
      qErrors.push(`Invalid correctOption: ${q.correctOption}`);
    }

    // Check category
    if (!q.categoryName) {
      qErrors.push('Missing categoryName');
    }

    // Check difficulty
    if (typeof q.difficulty !== 'number' || q.difficulty < 1 || q.difficulty > 5) {
      qErrors.push(`Invalid difficulty: ${q.difficulty}`);
    }

    if (qErrors.length === 0) {
      validCount++;
    } else {
      errors.push({ index, text: q.textAz?.substring(0, 30), qErrors });
    }
  });

  console.log('--- Bilik Arena Question Validation ---');
  console.log(`Total questions: ${total}`);
  console.log(`Valid count:    ${validCount}`);
  console.log(`Duplicates:     ${duplicates}`);
  console.log(`Errors found:   ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nError Details:');
    errors.forEach(err => {
      console.log(`[Item ${err.index}] ${err.text}... -> ${err.qErrors.join(', ')}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All questions are valid and unique!');
    process.exit(0);
  }
}

validate();
