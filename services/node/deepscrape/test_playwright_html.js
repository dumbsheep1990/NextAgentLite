const { chromium } = require('playwright');
const cheerio = require('cheerio');

const url = 'https://www.guizhou.gov.cn/zwgk/zcfg/szfwj/qfbf/202510/t20251021_88713156.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);  // Wait for JS to load

  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);

  console.log('=== Playwright HTML Analysis ===');
  console.log('Total HTML length:', html.length);
  console.log('');

  console.log('Testing selectors:');
  const selectors = ['#Zoom', '.DocHtmlCon', '.Box', 'body'];
  selectors.forEach(sel => {
    const elem = $(sel);
    console.log(`${sel}:`);
    console.log(`  Found: ${elem.length > 0 ? 'YES' : 'NO'}`);
    if (elem.length > 0) {
      console.log(`  Text length: ${elem.text().trim().length}`);
      console.log(`  First 80 chars: "${elem.text().trim().substring(0, 80)}"`);
    }
    console.log('');
  });

  // Check if content is inside an iframe or shadow DOM
  console.log('Checking for iframes:');
  const iframes = $('iframe');
  console.log(`Found ${iframes.length} iframes`);

  console.log('');
  console.log('HTML structure (first 1000 chars):');
  console.log(html.substring(0, 1000));
})();
