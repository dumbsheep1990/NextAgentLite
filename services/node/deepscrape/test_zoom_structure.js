const cheerio = require('cheerio');
const https = require('https');

const url = 'https://www.guizhou.gov.cn/zwgk/zcfg/szfwj/qfbf/202510/t20251021_88713156.html';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const $ = cheerio.load(data);
    const zoom = $('#Zoom');

    console.log('=== #Zoom Structure Analysis ===');
    console.log('Text length:', zoom.text().trim().length);
    console.log('');

    console.log('Elements inside #Zoom:');
    console.log('  - <p> tags:', zoom.find('p').length);
    console.log('  - <div> tags:', zoom.find('div').length);
    console.log('  - <span> tags:', zoom.find('span').length);
    console.log('  - Headings (h1-h6):', zoom.find('h1, h2, h3, h4, h5, h6').length);
    console.log('');

    console.log('Direct children of #Zoom:');
    zoom.children().each((i, el) => {
      const tag = $(el).prop('tagName');
      const textPreview = $(el).text().trim().substring(0, 80).replace(/\n/g, ' ');
      console.log(`  ${i}: <${tag}> - "${textPreview}..."`);
    });

    console.log('');
    console.log('Full HTML structure (first 500 chars):');
    console.log(zoom.html().substring(0, 500));
  });
}).on('error', console.error);
