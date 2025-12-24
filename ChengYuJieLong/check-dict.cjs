const data = require('./public/dictionary.json');
const found = data.chengyuList.find(c => c.text === '大展宏图');
console.log('Found 大展宏图:', found ? 'YES' : 'NO');
if (!found) {
  const similar = data.chengyuList.filter(c => c.text.startsWith('大展'));
  console.log('Similar entries:', similar.map(c => c.text));
}
