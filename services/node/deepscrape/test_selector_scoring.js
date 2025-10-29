const cheerio = require('cheerio');
const https = require('https');

const url = 'https://www.guizhou.gov.cn/zwgk/zcfg/szfwj/qfbf/202510/t20251021_88713156.html';

const MAIN_CONTENT_SELECTORS = [
    'article',
    'main',
    '.main-content',
    '.article',
    '.post',
    '.content',
    '#content',
    '[role="main"]',
    '.post-content',
    '.entry-content',
    '.page-content',
    '.article-content',
    '.main',
    '#main',
    '.body',
    '#body',
    '.DocHtmlCon',
    '#Zoom',
    '.Box',
    '.content_box',
    '.TRS_PreAppend',
    '.docbox',
    '.zwgk_content',
    '.article_box',
    '.article-body',
    '.doc_content',
];

function calculateContentScore(element, $) {
    const text = element.text().trim();
    const textLength = text.length;

    const html = element.html() || '';
    const htmlLength = html.length;
    const textToHtmlRatio = htmlLength > 0 ? textLength / htmlLength : 0;

    const paragraphs = element.find('p').length;
    const headings = element.find('h1, h2, h3, h4, h5, h6').length;
    const listItems = element.find('li').length;

    const links = element.find('a').length;
    const linkDensity = textLength > 0 ? links * 100 / textLength : 100;

    let score = (textLength * 0.1) +
        (paragraphs * 5) +
        (headings * 10) +
        (listItems * 2) +
        (textToHtmlRatio * 20) -
        (linkDensity * 2);

    return score;
}

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const $ = cheerio.load(data);

    console.log('=== Selector Scoring Analysis ===\n');

    const scores = [];

    for (const selector of MAIN_CONTENT_SELECTORS) {
        const element = $(selector);
        if (element.length) {
            const score = calculateContentScore(element, $);
            scores.push({
                selector,
                score,
                textLength: element.text().trim().length,
                paragraphs: element.find('p').length,
                headings: element.find('h1, h2, h3, h4, h5, h6').length
            });
        }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    console.log('Top 10 selectors by score:\n');
    scores.slice(0, 10).forEach((item, i) => {
        console.log(`${i + 1}. Selector: ${item.selector}`);
        console.log(`   Score: ${item.score.toFixed(2)}`);
        console.log(`   Text: ${item.textLength} chars`);
        console.log(`   Paragraphs: ${item.paragraphs}`);
        console.log(`   Headings: ${item.headings}`);
        console.log('');
    });
  });
}).on('error', console.error);
