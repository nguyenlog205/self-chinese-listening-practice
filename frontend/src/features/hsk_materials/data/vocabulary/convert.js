import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translate from 'translate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc CSV
const csv = fs.readFileSync(path.join(__dirname, 'hsk_level_07_09.csv'), 'utf8');
const lines = csv.split('\n').filter(line => line.trim() !== '');
lines.shift(); // header row

const items = lines.map(line => {
  let parts = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
  if (!parts) return null;
  while (parts.length < 4) parts.push('');
  const word = parts[0].replace(/^"|"$/g, '').trim();
  const pinyin = parts[1].replace(/^"|"$/g, '').trim();
  // Không lấy en nữa (có thể lấy nếu cần, nhưng sẽ trống)
  if (!word) return null;
  return { hanzi: word, pinyin };
}).filter(Boolean);

console.log(`📝 Tổng số từ: ${items.length}`);

async function translateAll() {
  const result = [];
  let count = 0;
  for (let item of items) {
    try {
      // Dịch từ tiếng Trung sang tiếng Việt
      const vi = await translate(item.hanzi, { from: 'zh', to: 'vi' });
      result.push({ ...item, vi, en: '' });
      console.log(`✅ ${item.hanzi} -> ${vi}`);
      count++;
    } catch {
      result.push({ ...item, vi: '', en: '' });
      console.log(`❌ Lỗi dịch ${item.hanzi}`);
    }
  }
  const output = `export default ${JSON.stringify(result, null, 2)};`;
  fs.writeFileSync(path.join(__dirname, 'hsk79.js'), output, 'utf8');
  console.log(`✅ Đã tạo file với ${result.length} từ (đã dịch ${count} từ).`);
}

translateAll();