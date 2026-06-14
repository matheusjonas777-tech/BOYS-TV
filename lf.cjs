const fs = require('fs');
const files = ['src/App.tsx', 'firestore.rules', 'src/types.ts', 'index.html'];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Converted ${file} to LF`);
  }
}
