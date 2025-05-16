import { transformCentercomData } from '@/utils'

export async function getCentercomData() {
  try {
    const response = await fetch(
      'https://computerparts.centrecom.com.au/api/search?cid=0ae1fd6a074947699fbe46df65ee5714&q=9070xt'
    )

    if (!response.ok) throw new Error('Failed to fetch centercom data')

    const data = await response.json()
    const sortedResults = data.p.sort((a, b) => Number(a.price) - Number(b.price))

    return transformCentercomData(sortedResults)
  } catch (error) {
    console.error('An error occurred:', error)
    throw error
  }
}

// Execute the scraper and handle the returned data
if (import.meta.url === import.meta.main) {
  getCentercomData()
    .then(data => console.log('Scraped data:', data))
    .catch(error => console.error('Scraping failed:', error))
}
