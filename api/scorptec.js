import puppeteer from 'puppeteer-core'
import chromium from 'chrome-aws-lambda'
import { fileURLToPath } from 'url'
import { transformScorptecData } from '@/utils'

export async function scrapeScorptec() {
  const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
  console.log('Launching browser in', isMainModule ? 'visible' : 'headless', 'mode')

  let browser
  try {
    const executablePath = (await chromium.executablePath) || process.env.PUPPETEER_EXECUTABLE_PATH

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })

    const page = await browser.newPage()

    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    )

    // Add request interception to block unnecessary resources
    await page.setRequestInterception(true)
    page.on('request', request => {
      const resourceType = request.resourceType()
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort()
      } else {
        request.continue()
      }
    })

    console.log('Navigating to Scorptec page...')

    // Navigate with optimized timeout and retry logic
    let retries = 3
    while (retries > 0) {
      try {
        await page.goto('https://www.scorptec.com.au/product/graphics-cards/radeonrx9070xt', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        })
        break
      } catch (error) {
        retries--
        if (retries === 0) throw error
        console.log(`Navigation failed, retrying... (${retries} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log('Page loaded, waiting for content...')

    // Wait for the product grid with retry logic
    let gridFound = false
    for (let i = 0; i < 3; i++) {
      try {
        await page.waitForSelector('#product-list-grid-wrapper', { timeout: 10000 })
        gridFound = true
        break
      } catch (error) {
        console.log(`Attempt ${i + 1} to find product grid failed`)
        if (i === 2) throw new Error('Product grid not found after multiple attempts')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    if (!gridFound) {
      throw new Error('Product grid not found')
    }

    // Extract product data from the grid using correct selectors
    const productData = await page.evaluate(() => {
      const parent = document.getElementById('product-list-grid-wrapper')
      if (!parent) {
        console.log('Parent element not found in evaluate')
        return []
      }

      const items = Array.from(parent.children)
      console.log('Found', items.length, 'product items')

      return items
        .map(item => {
          try {
            // Image URL
            const img = item.querySelector('.grid-product-image a img')
            const imgUrl = img ? img.src : null

            // Title
            const titleAnchor = item.querySelector('.grid-product-title a')
            const name = titleAnchor ? titleAnchor.innerText.trim() : null

            // Price
            const priceDiv = item.querySelector('.grid-product-price.float-left')
            const priceText = priceDiv ? priceDiv.innerText.trim() : null
            const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : null

            // Stock
            const stockDiv = item.querySelector('.grid-product-stock.float-right.status-box')
            const stockText = stockDiv ? stockDiv.innerText.trim().toLowerCase() : null
            const isInStock = stockText === 'in stock'

            if (!name || !price) {
              console.log('Skipping item due to missing required data:', { name, price })
              return null
            }

            return {
              imgUrl,
              name,
              price,
              isInStock,
            }
          } catch (error) {
            console.log('Error processing item:', error)
            return null
          }
        })
        .filter(Boolean) // Remove null items
    })

    if (!productData || productData.length === 0) {
      throw new Error('No valid product data found')
    }

    console.log('Scraped data:', productData)

    const transformedData = transformScorptecData(productData)
    return transformedData
  } catch (error) {
    console.error('An error occurred during scraping:', error)
    throw new Error(`Scraping failed: ${error.message}`)
  } finally {
    if (browser) {
      await browser.close()
    }
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
