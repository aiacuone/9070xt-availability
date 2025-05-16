import { getCentercomData } from '@/api/centercom.js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await getCentercomData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error scraping CenterCom:', error)
    return NextResponse.json({ error: 'Failed to scrape CenterCom' }, { status: 500 })
  }
}
