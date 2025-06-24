import puppeteer from 'puppeteer';

export async function htmlToPdf(html) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ 
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      bottom: '20px',
      left: '20px',
      right: '20px'
    }
  });
  await browser.close();
  return pdf;
}