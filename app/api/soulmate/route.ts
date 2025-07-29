import { NextRequest, NextResponse } from 'next/server'
import { generateSoulmateImage, generateCompatibilityAnalysis } from '@/lib/openai'
import { getCompatibilityScore, generateSoulmatePrompt } from '@/lib/utils'
import { ZodiacSign } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { 
      userSign, 
      genderPreference, 
      racePreference 
    } = await request.json()

    if (!userSign || !genderPreference || !racePreference) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Generate random compatible zodiac sign for soulmate
    const zodiacSigns: ZodiacSign[] = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ]
    const soulmateSign = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)]

    // Generate the soulmate image prompt
    const prompt = generateSoulmatePrompt(userSign, genderPreference, racePreference)

    // Generate the image
    const imageUrl = await generateSoulmateImage(prompt)

    // Calculate compatibility score
    const compatibilityScore = getCompatibilityScore(userSign, soulmateSign)

    // Generate compatibility analysis
    const analysis = await generateCompatibilityAnalysis(
      userSign,
      soulmateSign,
      genderPreference,
      racePreference
    )

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        soulmateSign,
        compatibilityScore,
        analysis
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