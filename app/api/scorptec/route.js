import { scrapeScorptec } from '@/api/scorptec.js'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[Scorptec API] Starting request...')
  try {
    console.log('[Scorptec API] Attempting to scrape...')
    const data = await scrapeScorptec()
    console.log('[Scorptec API] Successfully scraped data')
    return NextResponse.json(data)
  } catch (error) {
    // Format error for Netlify logs
    const errorDetails = {
      timestamp: new Date().toISOString(),
      errorType: error?.type || error?.name || 'Error',
      message: error?.message || 'Unknown error occurred',
      details: error?.details || {},
      stack: error?.stack,
    }

    // Log to Netlify's function logs
    console.error('[Scorptec API] Error:', JSON.stringify(errorDetails, null, 2))

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to scrape Scorptec',
        details: error?.message || 'Unknown error occurred',
        errorType: error?.type || error?.name || 'Error',
        timestamp: new Date().toISOString(),
        // Only include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
      },
      { status: 500 }
    )
  }
}
