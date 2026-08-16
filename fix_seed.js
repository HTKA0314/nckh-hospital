const fs = require('fs');
const path = require('path');

const seedFile = path.join(__dirname, 'lib', 'mock-data', 'seed-data.ts');
let content = fs.readFileSync(seedFile, 'utf8');

// Replace old statuses
const replacements = {
  "'WAITING_COUNCIL'": "'IRB_REVIEWING'",
  "'WAITING_ETHICS'": "'IRB_REVIEWING'",
  "'WAITING_ASSIGNMENT'": "'APPROVED_PENDING_CONTRACT'",
  "'WAITING_ACCEPTANCE'": "'CLOSING_SUBMITTED'",
  "'ACCEPTED'": "'COMPLETED'",
  "'RECOGNIZED'": "'COMPLETED'",
  "'CLOSED'": "'COMPLETED'",
  "'ARCHIVED'": "'COMPLETED'",
  "'SUSPENDED'": "'EXTENSION_REQUESTED'",
  "'REJECTED'": "'SCREENING_FAILED'",
};

for (const [oldValue, newValue] of Object.entries(replacements)) {
  const regex = new RegExp(oldValue, 'g');
  content = content.replace(regex, newValue);
}

// Replace financialSummary with financial and its new shape
content = content.replace(/financialSummary:\s*\{[\s\S]*?hasContract:\s*false,?\s*\}/g, `financial: {
      totalApprovedBudget: 150000000,
      totalAdvanced: 50000000,
      totalSettled: 0,
      remainingBudget: 100000000,
      budgetDetails: [],
      transactions: []
    }`);

fs.writeFileSync(seedFile, content, 'utf8');
console.log('Fixed seed-data.ts');
