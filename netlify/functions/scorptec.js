import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { transformScorptecData } from '../../utils'

class ScrapingError extends Error {
  constructor(message, type, details = {}) {
    super(message)
    this.name = 'ScrapingError'
    this.type = type
    this.details = details
  }
}

export async function handler(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  let browser
  try {
    console.log('[Scorptec Scraper] Initializing Puppeteer...')
    const launchOptions = {
      headless: 'new',
      defaultViewport: null,
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      ignoreHTTPSErrors: true,
    }

    browser = await puppeteer.launch(launchOptions)
    console.log('[Scorptec Scraper] Browser launched successfully')

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    )

    await page.goto('https://www.scorptec.com.au/product/graphics-cards/radeonrx9070xt', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })

    await page.waitForSelector('#product-list-grid-wrapper', { timeout: 10000 })
    await new Promise(resolve => setTimeout(resolve, 2000))

    const productData = await page.evaluate(() => {
      const parent = document.getElementById('product-list-grid-wrapper')
      if (!parent) {
        throw new Error('Parent element not found in evaluate')
      }

      const items = Array.from(parent.children)
      return items.map(item => {
        const img = item.querySelector('.grid-product-image a img')
        const titleAnchor = item.querySelector('.grid-product-title a')
        const priceDiv = item.querySelector('.grid-product-price.float-left')
        const stockDiv = item.querySelector('.grid-product-stock.float-right.status-box')

        return {
          imgUrl: img ? img.src : null,
          name: titleAnchor ? titleAnchor.innerText.trim() : null,
          price: priceDiv ? priceDiv.innerText.trim().replace('$', '') : null,
          isInStock: stockDiv ? stockDiv.innerText.trim() === 'in stock' : false,
        }
      })
    })

    if (!productData || productData.length === 0) {
      throw new ScrapingError('No product data found', 'DATA_ERROR')
    }

    const transformedData = transformScorptecData(productData)

    console.log('[Scorptec Scraper] Successfully scraped data:')
    console.log('Number of items found:', transformedData.length)
    console.log('Preview of first item:', JSON.stringify(transformedData[0], null, 2))
    console.log('All items:', JSON.stringify(transformedData, null, 2))

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformedData),
    }
  } catch (error) {
    console.error('[Scorptec Scraper] Error:', error)

    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.message,
        type: error.type || 'UNKNOWN_ERROR',
        details: error.details || {},
      }),
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
