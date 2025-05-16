import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { transformScorptecData } from '@/utils'

class ScrapingError extends Error {
  constructor(message, type, details = {}) {
    super(message)
    this.name = 'ScrapingError'
    this.type = type
    this.details = details
  }
}

export async function scrapeScorptec() {
  const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
  console.log('Launching browser in', isMainModule ? 'visible' : 'headless', 'mode')

  let browser
  try {
    console.log('Initializing Puppeteer...')
    const launchOptions = {
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
    }

    console.log('Launch options:', {
      headless: launchOptions.headless,
      executablePath: launchOptions.executablePath ? 'set' : 'not set',
      args: launchOptions.args,
    })

    try {
      browser = await puppeteer.launch(launchOptions)
      console.log('Browser launched successfully')
    } catch (launchError) {
      throw new ScrapingError('Failed to launch browser', 'BROWSER_LAUNCH_ERROR', {
        originalError: launchError.message,
        launchOptions: {
          headless: launchOptions.headless,
          executablePath: launchOptions.executablePath ? 'set' : 'not set',
        },
      })
    }

    let page
    try {
      page = await browser.newPage()
      console.log('New page created')
    } catch (pageError) {
      throw new ScrapingError('Failed to create new page', 'PAGE_CREATION_ERROR', {
        originalError: pageError.message,
      })
    }

    // Set a realistic user agent
    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      )
      console.log('User agent set')
    } catch (userAgentError) {
      throw new ScrapingError('Failed to set user agent', 'USER_AGENT_ERROR', {
        originalError: userAgentError.message,
      })
    }

    console.log('Navigating to Scorptec page...')

    try {
      // Navigate with optimized timeout
      await page.goto('https://www.scorptec.com.au/product/graphics-cards/radeonrx9070xt', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      console.log('Page navigation successful')
    } catch (error) {
      throw new ScrapingError('Failed to navigate to Scorptec page', 'NAVIGATION_ERROR', {
        originalError: error.message,
        url: 'https://www.scorptec.com.au/product/graphics-cards/radeonrx9070xt',
      })
    }

    console.log('Page loaded, waiting for content...')

    try {
      // Wait for the product grid to be present with longer timeout
      await page.waitForSelector('#product-list-grid-wrapper', { timeout: 10000 })
      console.log('Product grid found')
    } catch (error) {
      throw new ScrapingError('Product grid not found after timeout', 'SELECTOR_ERROR', {
        selector: '#product-list-grid-wrapper',
        originalError: error.message,
        pageUrl: await page.url(),
      })
    }

    // Reduced delay for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Extract product data from the grid using correct selectors
    let productData
    try {
      productData = await page.evaluate(() => {
        const parent = document.getElementById('product-list-grid-wrapper')
        if (!parent) {
          throw new Error('Parent element not found in evaluate')
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
      console.log('Product data extracted successfully')
    } catch (error) {
      throw new ScrapingError('Failed to extract product data', 'DATA_EXTRACTION_ERROR', {
        originalError: error.message,
        pageUrl: await page.url(),
      })
    }

    if (!productData || productData.length === 0) {
      throw new ScrapingError('No product data found', 'DATA_ERROR', { pageUrl: await page.url() })
    }

    console.log('Scraped data:', productData)

    try {
      const transformedData = transformScorptecData(productData)
      console.log('Data transformation successful')
      return transformedData
    } catch (error) {
      throw new ScrapingError('Failed to transform data', 'TRANSFORMATION_ERROR', {
        originalError: error.message,
        rawData: productData,
      })
    }
  } catch (error) {
    // If it's already a ScrapingError, just rethrow it
    if (error instanceof ScrapingError) {
      throw error
    }

    // Otherwise, wrap it in a ScrapingError
    throw new ScrapingError('An error occurred during scraping', 'UNKNOWN_ERROR', {
      originalError: error.message,
      stack: error.stack,
    })
  } finally {
    if (browser) {
      try {
        await browser.close()
        console.log('Browser closed successfully')
      } catch (closeError) {
        console.error('Failed to close browser:', closeError)
      }
    }
  }
}

// Execute the scraper and handle the returned data
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule) {
  console.log('Running scraper directly...')
  scrapeScorptec()
    .then(data => {
      console.log('Scraping completed successfully:', data)
      process.exit(0)
    })
    .catch(error => {
      console.error('Scraping failed:', {
        message: error.message,
        type: error.type,
        details: error.details,
        stack: error.stack,
      })
      process.exit(1)
    })
}
