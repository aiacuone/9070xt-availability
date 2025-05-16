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
  console.log(
    '[Scorptec Scraper] Launching browser in',
    isMainModule ? 'visible' : 'headless',
    'mode'
  )

  let browser
  try {
    console.log('[Scorptec Scraper] Initializing Puppeteer...')
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

    console.log(
      '[Scorptec Scraper] Launch options:',
      JSON.stringify(
        {
          headless: launchOptions.headless,
          executablePath: launchOptions.executablePath ? 'set' : 'not set',
          args: launchOptions.args,
        },
        null,
        2
      )
    )

    try {
      browser = await puppeteer.launch(launchOptions)
      console.log('[Scorptec Scraper] Browser launched successfully')
    } catch (launchError) {
      const errorDetails = {
        timestamp: new Date().toISOString(),
        errorType: 'BROWSER_LAUNCH_ERROR',
        message: 'Failed to launch browser',
        details: {
          originalError: launchError.message,
          launchOptions: {
            headless: launchOptions.headless,
            executablePath: launchOptions.executablePath ? 'set' : 'not set',
          },
        },
      }
      console.error('[Scorptec Scraper] Error:', JSON.stringify(errorDetails, null, 2))
      throw new ScrapingError(
        'Failed to launch browser',
        'BROWSER_LAUNCH_ERROR',
        errorDetails.details
      )
    }

    let page
    try {
      page = await browser.newPage()
      console.log('[Scorptec Scraper] New page created')
    } catch (pageError) {
      const errorDetails = {
        timestamp: new Date().toISOString(),
        errorType: 'PAGE_CREATION_ERROR',
        message: 'Failed to create new page',
        details: { originalError: pageError.message },
      }
      console.error('[Scorptec Scraper] Error:', JSON.stringify(errorDetails, null, 2))
      throw new ScrapingError('Failed to create new page', 'PAGE_CREATION_ERROR', {
        originalError: pageError.message,
      })
    }

    // Set a realistic user agent
    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      )
      console.log('[Scorptec Scraper] User agent set')
    } catch (userAgentError) {
      const errorDetails = {
        timestamp: new Date().toISOString(),
        errorType: 'USER_AGENT_ERROR',
        message: 'Failed to set user agent',
        details: { originalError: userAgentError.message },
      }
      console.error('[Scorptec Scraper] Error:', JSON.stringify(errorDetails, null, 2))
      throw new ScrapingError('Failed to set user agent', 'USER_AGENT_ERROR', {
        originalError: userAgentError.message,
      })
    }

    console.log('[Scorptec Scraper] Navigating to Scorptec page...')

    try {
      // Navigate with optimized timeout
      await page.goto('https://www.scorptec.com.au/product/graphics-cards/radeonrx9070xt', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      console.log('[Scorptec Scraper] Page navigation successful')
    } catch (error) {
      const errorDetails = {
        timestamp: new Date().toISOString(),
        errorType: 'NAVIGATION_ERROR',
        message: 'Failed to navigate to Scorptec page',
        details: {
          originalError: error.message,
          url: 'https://www.scorptec.com.au/product/graphics-cards/radeonrx9070xt',
        },
      }
      console.error('[Scorptec Scraper] Error:', JSON.stringify(errorDetails, null, 2))
      throw new ScrapingError(
        'Failed to navigate to Scorptec page',
        'NAVIGATION_ERROR',
        errorDetails.details
      )
    }

    console.log('[Scorptec Scraper] Page loaded, waiting for content...')

    try {
      // Wait for the product grid to be present with longer timeout
      await page.waitForSelector('#product-list-grid-wrapper', { timeout: 10000 })
      console.log('[Scorptec Scraper] Product grid found')
    } catch (error) {
      const errorDetails = {
        timestamp: new Date().toISOString(),
        errorType: 'SELECTOR_ERROR',
        message: 'Product grid not found after timeout',
        details: {
          selector: '#product-list-grid-wrapper',
          originalError: error.message,
          pageUrl: await page.url(),
        },
      }
      console.error('[Scorptec Scraper] Error:', JSON.stringify(errorDetails, null, 2))
      throw new ScrapingError(
        'Product grid not found after timeout',
        'SELECTOR_ERROR',
        errorDetails.details
      )
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
        console.log('[Scorptec Scraper] Found', items.length, 'product items')

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
      console.log('[Scorptec Scraper] Product data extracted successfully')
    } catch (error) {
      const errorDetails = {
        timestamp: new Date().toISOString(),
        errorType: 'DATA_EXTRACTION_ERROR',
        message: 'Failed to extract product data',
        details: {
          originalError: error.message,
          pageUrl: await page.url(),
        },
      }
      console.error('[Scorptec Scraper] Error:', JSON.stringify(errorDetails, null, 2))
      throw new ScrapingError(
        'Failed to extract product data',
        'DATA_EXTRACTION_ERROR',
        errorDetails.details
      )
    }

    if (!productData || productData.length === 0) {
      const errorDetails = {
        timestamp: new Date().toISOString(),
        errorType: 'DATA_ERROR',
        message: 'No product data found',
        details: { pageUrl: await page.url() },
      }
      console.error('[Scorptec Scraper] Error:', JSON.stringify(errorDetails, null, 2))
      throw new ScrapingError('No product data found', 'DATA_ERROR', errorDetails.details)
    }

    console.log('[Scorptec Scraper] Scraped data:', JSON.stringify(productData, null, 2))

    try {
      const transformedData = transformScorptecData(productData)
      console.log('[Scorptec Scraper] Data transformation successful')
      return transformedData
    } catch (error) {
      const errorDetails = {
        timestamp: new Date().toISOString(),
        errorType: 'TRANSFORMATION_ERROR',
        message: 'Failed to transform data',
        details: {
          originalError: error.message,
          rawData: productData,
        },
      }
      console.error('[Scorptec Scraper] Error:', JSON.stringify(errorDetails, null, 2))
      throw new ScrapingError(
        'Failed to transform data',
        'TRANSFORMATION_ERROR',
        errorDetails.details
      )
    }
  } catch (error) {
    // If it's already a ScrapingError, just rethrow it
    if (error instanceof ScrapingError) {
      throw error
    }

    // Otherwise, wrap it in a ScrapingError
    const errorDetails = {
      timestamp: new Date().toISOString(),
      errorType: 'UNKNOWN_ERROR',
      message: 'An error occurred during scraping',
      details: {
        originalError: error.message,
        stack: error.stack,
      },
    }
    console.error('[Scorptec Scraper] Error:', JSON.stringify(errorDetails, null, 2))
    throw new ScrapingError(
      'An error occurred during scraping',
      'UNKNOWN_ERROR',
      errorDetails.details
    )
  } finally {
    if (browser) {
      try {
        await browser.close()
        console.log('[Scorptec Scraper] Browser closed successfully')
      } catch (closeError) {
        console.error(
          '[Scorptec Scraper] Failed to close browser:',
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              errorType: 'BROWSER_CLOSE_ERROR',
              message: 'Failed to close browser',
              details: { originalError: closeError.message },
            },
            null,
            2
          )
        )
      }
    }
  }
}

// Execute the scraper and handle the returned data
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule) {
  console.log('[Scorptec Scraper] Running scraper directly...')
  scrapeScorptec()
    .then(data => {
      console.log(
        '[Scorptec Scraper] Scraping completed successfully:',
        JSON.stringify(data, null, 2)
      )
      process.exit(0)
    })
    .catch(error => {
      console.error(
        '[Scorptec Scraper] Scraping failed:',
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            errorType: error.type || 'UNKNOWN_ERROR',
            message: error.message,
            details: error.details,
            stack: error.stack,
          },
          null,
          2
        )
      )
      process.exit(1)
    })
}
