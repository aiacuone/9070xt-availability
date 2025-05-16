import { getPcCasegearData } from '@/api/pccasegear.js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await getPcCasegearData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error scraping PCCaseGear:', error)
    return NextResponse.json({ error: 'Failed to scrape PCCaseGear' }, { status: 500 })
  }
}
