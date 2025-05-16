import puppeteer from 'puppeteer'

export async function scrapePCCaseGear() {
  const browser = await puppeteer.launch({ headless: 'new' })
  try {
    const page = await browser.newPage()
    await page.goto('https://www.pccasegear.com/products/9070xt')

    const data = await page.evaluate(() => {
      const priceElement = document.querySelector('.product-price')
      const stockElement = document.querySelector('.stock-status')
      const nameElement = document.querySelector('.product-name')
      const imageElement = document.querySelector('.product-image img')

      return {
        name: nameElement?.textContent?.trim() || '9070XT',
        price: priceElement ? parseFloat(priceElement.textContent.replace(/[^0-9.]/g, '')) : null,
        isInStock: stockElement?.textContent?.toLowerCase().includes('in stock') || false,
        imgUrl: imageElement?.src || '',
        storeImgUrl: '/pccasegear-logo.png',
        url: window.location.href,
      }
    })

    return data
  } finally {
    await browser.close()
  }
}
