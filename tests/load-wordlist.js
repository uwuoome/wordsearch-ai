import fs  from 'fs';
import readline from 'readline';

export async function loadWordList(filePath) {
  const lines = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity 
  });
  for await (const line of rl) {
    if(line.trim()) lines.push(line.trim());
  }
  return lines;
}