import { transformPcCasegearData } from '@/utils'

export async function getPcCasegearData() {
  try {
    const response = await fetch(
      'https://hpd3dbj2io-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(3.35.1)%3B%20Browser%20(lite)&x-algolia-application-id=HPD3DBJ2IO&x-algolia-api-key=9559cf1a6c7521a30ba0832ec6c38499',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ indexName: 'pccg_products', params: 'query=9070xt' }],
        }),
      }
    )

    if (!response.ok) throw new Error('Failed to fetch pccasegear data')

    const data = await response.json()

    const sortedResults = data.results[0].hits.sort(
      (a, b) => Number(a.gtmProducts.price) - Number(b.gtmProducts.price)
    )

    return transformPcCasegearData(sortedResults)
  } catch (error) {
    console.error('An error occurred:', error)
    throw error
  }
}

// Execute the scraper and handle the returned data
if (import.meta.url === import.meta.main) {
  getPcCasegearData()
    .then(data => console.log('Scraped data:', data))
    .catch(error => console.error('Scraping failed:', error))
}
