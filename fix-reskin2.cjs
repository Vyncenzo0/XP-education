const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.css') || filePath.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix lingering brackets
  content = content.replace(/from-\[indigo-600\]/g, 'from-indigo-600');
  content = content.replace(/to-\[indigo-600\]/g, 'to-indigo-600');
  content = content.replace(/via-\[indigo-600\]/g, 'via-indigo-600');
  content = content.replace(/from-\[indigo-500\]/g, 'from-indigo-500');
  content = content.replace(/to-\[indigo-500\]/g, 'to-indigo-500');
  content = content.replace(/via-\[indigo-500\]/g, 'via-indigo-500');

  // Clean up double assignments (like text-stone-500 text-stone-600)
  content = content.replace(/text-stone-500 text-stone-600/g, 'text-stone-500');
  content = content.replace(/text-stone-200 text-stone-200/g, 'text-stone-200');

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Fix complete 2');
