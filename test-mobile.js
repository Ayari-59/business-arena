import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/opt/pw-browsers/chromium' 
  });
  const context = await browser.createContext({
    viewport: { width: 400, height: 800 },
    isMobile: true,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  
  // Navigate to home
  await page.goto('http://localhost:3030', { waitUntil: 'networkidle' });
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/mobile-home.png' });
  console.log('Screenshot saved to /tmp/mobile-home.png');
  
  await browser.close();
})();
