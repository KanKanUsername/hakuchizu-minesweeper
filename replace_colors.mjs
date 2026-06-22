import fs from 'fs';

const colorMap = {
  'bg-white': 'bg-surface',
  'bg-\\[#EAF0EE\\]': 'bg-paper',
  'border-\\[#EAF0EE\\]': 'border-paper',
  'bg-\\[#DCE6E2\\]': 'bg-paper-deep',
  'border-\\[#DCE6E2\\]': 'border-paper-deep',
  'border-\\[#B9C7C1\\]': 'border-line',
  'text-\\[#1B2A41\\]': 'text-ink',
  'bg-\\[#1B2A41\\]': 'bg-ink',
  'border-\\[#1B2A41\\]': 'border-ink',
  'text-\\[#4A5A6E\\]': 'text-ink-soft',
  'bg-\\[#4A5A6E\\]': 'bg-ink-soft',
  'border-\\[#4A5A6E\\]': 'border-ink-soft',
  'text-\\[#6C9A82\\]': 'text-safe',
  'bg-\\[#6C9A82\\]': 'bg-safe',
  'text-\\[#C97A2B\\]': 'text-amber',
  'bg-\\[#C97A2B\\]': 'bg-amber',
  'border-\\[#C97A2B\\]': 'border-amber',
  'text-\\[#AD3F36\\]': 'text-danger',
  'bg-\\[#AD3F36\\]': 'bg-danger',
  'border-\\[#AD3F36\\]': 'border-danger',
  'bg-\\[#F6F2E8\\]': 'bg-map-unopened',
  'bg-\\[#FBE9CE\\]': 'bg-map-adjacent',
  'bg-white/90': 'bg-surface/90',
  'bg-white/95': 'bg-surface/95',
  'bg-white/80': 'bg-surface/80',
};

function replaceColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [key, value] of Object.entries(colorMap)) {
    const regex = new RegExp(key, 'g');
    content = content.replace(regex, value);
  }
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

replaceColors('src/App.tsx');
replaceColors('src/components/TitleScreen.tsx');
replaceColors('src/components/MapBoard.tsx');
