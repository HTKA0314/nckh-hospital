const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'lib');
const appDirectoryPath = path.join(__dirname, 'app');
const componentsDirectoryPath = path.join(__dirname, 'components');

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

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFiles(directory) {
  walkDir(directory, function(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      for (const [oldValue, newValue] of Object.entries(replacements)) {
        // Regex to replace exact string literals
        const regex = new RegExp(oldValue, 'g');
        content = content.replace(regex, newValue);
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  });
}

processFiles(directoryPath);
processFiles(appDirectoryPath);
processFiles(componentsDirectoryPath);
console.log('Done.');
