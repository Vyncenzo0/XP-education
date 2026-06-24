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

  content = content.replace(/shadow-\[indigo-600\]/g, 'shadow-indigo-600');
  content = content.replace(/border-\[indigo-600\]/g, 'border-indigo-600');
  content = content.replace(/bg-\[indigo-600\]/g, 'bg-indigo-600');
  content = content.replace(/text-\[indigo-600\]/g, 'text-indigo-600');

  // Double assignments
  content = content.replace(/bg-stone-900 shadow-none border-stone-800 border-stone-800 text-stone-100/g, 'bg-stone-900 shadow-none border-stone-800 text-stone-100');
  content = content.replace(/bg-white shadow-sm border-stone-200 border-stone-200 text-stone-900/g, 'bg-white shadow-sm border-stone-200 text-stone-900');
  content = content.replace(/text-stone-500 text-stone-600/g, 'text-stone-500');

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Fix complete 3');
