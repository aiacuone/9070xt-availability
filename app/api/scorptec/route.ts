import { scrapeScorptec } from '@/api/scorptec.js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await scrapeScorptec()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error scraping Scorptec:', error)
    return NextResponse.json({ error: 'Failed to scrape Scorptec' }, { status: 500 })
  }
}
