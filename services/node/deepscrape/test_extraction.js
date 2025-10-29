const cheerio = require('cheerio');
const https = require('https');

const url = 'https://www.guizhou.gov.cn/zwgk/zcfg/szfwj/qfbf/202510/t20251021_88713156.html';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const $ = cheerio.load(data);

    console.log('=== Page Analysis ===');
    console.log('Total HTML length:', data.length);
    console.log('');

    // Test different selectors
    const selectors = ['#Zoom', '.DocHtmlCon', '#content', 'article', 'main'];

    selectors.forEach(sel => {
      const elem = $(sel);
      console.log(`Selector "${sel}":`);
      console.log(`  - Found: ${elem.length > 0 ? 'YES' : 'NO'}`);
      if (elem.length > 0) {
        console.log(`  - Text length: ${elem.text().trim().length}`);
        console.log(`  - HTML length: ${elem.html().length}`);
        console.log(`  - First 100 chars: "${elem.text().trim().substring(0, 100)}"`);
      }
      console.log('');
    });

    // Check what the page structure looks like
    console.log('=== Page Structure ===');
    console.log('Headings (h1, h2, h3):');
    $('h1, h2, h3').each((i, el) => {
      console.log(`  - ${$(el).prop('tagName')}: "${$(el).text().trim()}"`);
    });
  });
}).on('error', console.error);
