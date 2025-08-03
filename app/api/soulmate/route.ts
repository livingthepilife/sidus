import { NextRequest, NextResponse } from 'next/server'
import { generateSoulmateImage, generateCompatibilityAnalysis } from '@/lib/openai'
import { getCompatibilityScore, generateSoulmatePrompt } from '@/lib/utils'
import { ZodiacSign } from '@/types'

export async function POST(request: NextRequest) {
  try {
    console.log('Soulmate API called')
    
    const { 
      userSign, 
      genderPreference, 
      racePreference 
    } = await request.json()

    console.log('Received parameters:', { userSign, genderPreference, racePreference })

    if (!userSign || !genderPreference || !racePreference) {
      console.log('Missing required parameters')
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Generate random compatible zodiac signs for soulmate
    const zodiacSigns: ZodiacSign[] = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ]
    
    // Generate random signs for sun, moon, and rising
    const sunSign = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)]
    const moonSign = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)]
    const risingSign = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)]
    
    // Use sun sign as the main soulmate sign
    const soulmateSign = sunSign

    // Generate the soulmate image prompt
    const prompt = generateSoulmatePrompt(userSign, genderPreference, racePreference)
    console.log('Generated prompt:', prompt)

    // Generate the image
    console.log('Generating image...')
    const imageUrl = await generateSoulmateImage(prompt)
    console.log('Image generated:', imageUrl)

    // Calculate compatibility score (90-100% for soulmates)
    const baseScore = getCompatibilityScore(userSign, soulmateSign)
    const soulmateScore = Math.floor(Math.random() * 11) + 90 // Random between 90-100
    const compatibilityScore = soulmateScore

    // Generate compatibility analysis
    const analysis = await generateCompatibilityAnalysis(
      userSign,
      soulmateSign,
      genderPreference,
      racePreference
    )

    // Store the soulmate in the database
    const soulmateData = {
      personalInfo: {
        name: "Your Soulmate",
        gender: genderPreference,
        ethnicity: racePreference
      },
      astrologicalInfo: {
        sun_sign: sunSign,
        moon_sign: moonSign,
        rising_sign: risingSign,
        soulmate_sign: soulmateSign
      },
      compatibilityInfo: {
        compatibility_score: compatibilityScore,
        analysis: analysis,
        short_description: `Your passion meets their fiery ${soulmateSign} spirit, igniting thrilling adventures, while your shared ${risingSign} rising fosters an intense emotional bond, creating an unbreakable connection.`
      },
      imageUrl: imageUrl
    }

    // Call the soulmates API to store the data
    try {
      const storeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/soulmates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(soulmateData)
      })

      if (!storeResponse.ok) {
        console.error('Failed to store soulmate in database')
      }
    } catch (storeError) {
      console.error('Error storing soulmate:', storeError)
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        soulmateSign,
        compatibilityScore,
        analysis,
        sunSign,
        moonSign,
        risingSign
      }
    })

  } catch (error) {
    console.error('Soulmate generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate soulmate' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Soulmate API is working' })
} 