const data = require('./public/dictionary.json');

// Check "只欠东风"
const zhiqiandongfeng = data.chengyuList.find(c => c.text === '只欠东风');
if (zhiqiandongfeng) {
  console.log('只欠东风:', zhiqiandongfeng);
  console.log('Last char:', zhiqiandongfeng.chars[3]);
  console.log('Last pinyin:', zhiqiandongfeng.pinyin[3]);
  console.log('Last toneless:', zhiqiandongfeng.pinyinNoTone[3]);
}

console.log('\n---\n');

// Check "糊里糊涂"
const hulihututu = data.chengyuList.find(c => c.text === '糊里糊涂');
if (hulihututu) {
  console.log('糊里糊涂:', hulihututu);
  console.log('First char:', hulihututu.chars[0]);
  console.log('First pinyin:', hulihututu.pinyin[0]);
  console.log('First toneless:', hulihututu.pinyinNoTone[0]);
}

console.log('\n---\n');

// Check what chengyus should follow "只欠东风"
if (zhiqiandongfeng) {
  const lastToneless = zhiqiandongfeng.pinyinNoTone[3];
  const nextOptions = data.tonelessMap[lastToneless] || [];
  console.log(`Chengyus that can follow "只欠东风" (toneless "${lastToneless}"):`);
  console.log('Count:', nextOptions.length);
  console.log('First 10:', nextOptions.slice(0, 10).map(c => c.text));

  // Check if 糊里糊涂 is in there
  const hasHuli = nextOptions.some(c => c.text === '糊里糊涂');
  console.log('\nContains "糊里糊涂"?', hasHuli);
}
