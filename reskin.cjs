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

  // Font replacements
  content = content.replace(/font-extrabold/g, 'font-medium');
  // Avoid replacing font-bold entirely unless it refers to headings? The prompt says Heading (H1-H4): display, Body: sans, Mono: mono.
  // We'll replace `font-sans font-extrabold` with `font-display font-medium` for headings if possible.
  
  // Actually, let's just do bulk replacements where obvious:
  // Colors - Slate/Zinc to Stone
  content = content.replace(/slate-950/g, 'stone-950');
  content = content.replace(/slate-900/g, 'stone-900');
  content = content.replace(/slate-800/g, 'stone-800');
  content = content.replace(/slate-700/g, 'stone-700');
  content = content.replace(/slate-600/g, 'stone-600');
  content = content.replace(/slate-500/g, 'stone-500');
  content = content.replace(/slate-400/g, 'stone-400');
  content = content.replace(/slate-300/g, 'stone-300');
  content = content.replace(/slate-200/g, 'stone-200');
  content = content.replace(/slate-100/g, 'stone-100');
  content = content.replace(/slate-50/g, 'stone-50');

  content = content.replace(/zinc-950/g, 'stone-950');
  content = content.replace(/zinc-900/g, 'stone-900');
  content = content.replace(/zinc-800/g, 'stone-800');
  content = content.replace(/zinc-700/g, 'stone-700');
  content = content.replace(/zinc-600/g, 'stone-600');
  content = content.replace(/zinc-500/g, 'stone-500');
  content = content.replace(/zinc-400/g, 'stone-400');
  content = content.replace(/zinc-300/g, 'stone-300');
  content = content.replace(/zinc-200/g, 'stone-200');
  content = content.replace(/zinc-100/g, 'stone-100');
  content = content.replace(/zinc-50/g, 'stone-50');

  // Specific brand colors
  content = content.replace(/#001489/g, 'indigo-600'); 
  // Wait, if it's text-[#001489], replacing with text-indigo-600 will make it text-indigo-600 which is valid Tailwind!
  // But wait! border-[#001489] -> border-indigo-600.
  // bg-[#001489] -> bg-indigo-600.
  // text-[#c8102e] -> text-indigo-500 (since dark theme accent is indigo-400 or indigo-500). Wait, #c8102e was used for both? In dark mode it was often the accent red. Let's map #c8102e to indigo-500.

  // Let's do regex to replace generic hardcoded colors
  content = content.replace(/bg-\[#001489\]\/[0-9]+/g, 'bg-indigo-600');
  content = content.replace(/border-\[#001489\]\/[0-9]+/g, 'border-indigo-600 text-indigo-600');
  
  content = content.replace(/\[#001489\]/g, 'indigo-600');
  content = content.replace(/\[#c8102e\]/g, 'indigo-500');

  // Replace specific background gradients with flat colors or simpler gradients
  content = content.replace(/subtle-light-gradient/g, 'bg-white shadow-sm border-stone-200');
  content = content.replace(/subtle-dark-gradient/g, 'bg-stone-900 shadow-none border-stone-800');
  content = content.replace(/dark-four-color-gradient/g, 'bg-stone-950');
  content = content.replace(/four-color-gradient/g, 'bg-stone-50');

  // Shape replacements
  content = content.replace(/rounded-2xl/g, 'rounded-xl');
  content = content.replace(/rounded-3xl/g, 'rounded-xl');

  // Remove bold where specified fonts take over
  content = content.replace(/font-extrabold/g, 'font-medium');
  content = content.replace(/font-bold/g, 'font-medium');

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Reskin complete');
