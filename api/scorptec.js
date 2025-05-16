import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { transformScorptecData } from '@/utils'

export async function scrapeScorptec() {
  const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
  console.log('Launching browser in', isMainModule ? 'visible' : 'headless', 'mode')

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080',
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  })

  try {
    const page = await browser.newPage()

    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    )

    console.log('Navigating to Scorptec page...')

    // Navigate with optimized timeout
    await page.goto('https://www.scorptec.com.au/product/graphics-cards/radeonrx9070xt', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })

    console.log('Page loaded, waiting for content...')

    // Wait for the product grid to be present with longer timeout
    await page.waitForSelector('#product-list-grid-wrapper', { timeout: 10000 }).catch(error => {
      console.error('Failed to find product grid:', error)
      throw new Error('Product grid not found after timeout')
    })

    // Reduced delay for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Extract product data from the grid using correct selectors
    const productData = await page.evaluate(() => {
      const parent = document.getElementById('product-list-grid-wrapper')
      if (!parent) {
        console.log('Parent element not found in evaluate')
        return []
      }

      const items = Array.from(parent.children)
      console.log('Found', items.length, 'product items')

      return items.map(item => {
        // Image URL
        const img = item.querySelector('.grid-product-image a img')
        const imgUrl = img ? img.src : null

        // Title
        const titleAnchor = item.querySelector('.grid-product-title a')
        const name = titleAnchor ? titleAnchor.innerText.trim() : null

        // Price
        const priceDiv = item.querySelector('.grid-product-price.float-left')
        const price = priceDiv ? priceDiv.innerText.trim().replace('$', '') : null

        // Stock
        const stockDiv = item.querySelector('.grid-product-stock.float-right.status-box')
        const stockText = stockDiv ? stockDiv.innerText.trim() : null

        return {
          imgUrl,
          name,
          price,
          isInStock: stockText === 'in stock',
        }
      })
    })

    if (!productData || productData.length === 0) {
      throw new Error('No product data found')
    }

    console.log('Scraped data:', productData)

    const transformedData = transformScorptecData(productData)
    return transformedData
  } catch (error) {
    console.error('An error occurred during scraping:', error)
    throw new Error(`Scraping failed: ${error.message}`)
  } finally {
    await browser.close()
  }
}

// Execute the scraper and handle the returned data
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule) {
  console.log('Running scraper directly...')
  scrapeScorptec()
    .then(data => {
      console.log('Scraped data:', data)
      process.exit(0)
    })
    .catch(error => {
      console.error('Scraping failed:', error)
      process.exit(1)
    })
}
