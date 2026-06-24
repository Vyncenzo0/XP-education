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

  // Fix brackets issue
  content = content.replace(/text-\[indigo-600\]/g, 'text-indigo-600');
  content = content.replace(/bg-\[indigo-600\]/g, 'bg-indigo-600');
  content = content.replace(/border-\[indigo-600\]/g, 'border-indigo-600');
  
  content = content.replace(/text-\[indigo-500\]/g, 'text-indigo-500');
  content = content.replace(/bg-\[indigo-500\]/g, 'bg-indigo-500');
  content = content.replace(/border-\[indigo-500\]/g, 'border-indigo-500');
  content = content.replace(/shadow-\[indigo-500\]/g, 'shadow-indigo-500');

  // Any other artifacts like `border-slate-205` or `text-slate-205` which might exist from partial substitutions
  content = content.replace(/slate-205/g, 'stone-200');
  content = content.replace(/slate-405/g, 'stone-400');
  content = content.replace(/slate-605/g, 'stone-500');
  content = content.replace(/slate-650/g, 'stone-500');
  content = content.replace(/slate-705/g, 'stone-700');
  content = content.replace(/slate-850/g, 'stone-800');

  // Let's also enforce rounded-md for buttons
  // This is tricky, but we can replace `rounded-lg` with `rounded-md` specifically where there's a button if we were doing HTML, but maybe globally `rounded-2xl` was changed to `rounded-xl` in the last pass.
  // There's a rule "Cards: rounded-lg or rounded-xl, Buttons/Inputs: rounded-md, Tags: rounded-full"
  
  fs.writeFileSync(file, content, 'utf8');
});

console.log('Fix complete');
