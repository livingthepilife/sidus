import OpenAI from 'openai';

const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
};

export async function generateChatResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  chatType: string,
  userContext?: any
): Promise<string> {
  try {
    let systemPrompt = '';
    
    switch (chatType) {
      case 'onboarding':
        systemPrompt = `You are Sidus, a wise and mystical astrological guide. You're helping a new user through their onboarding journey. Be warm, engaging, and conversational. Ask one question at a time and respond naturally to their answers. Guide them through collecting their name, birthday, and birth location. Keep responses concise but mystical and encouraging.`;
        break;
      case 'general':
        systemPrompt = `You are Sidus, a compassionate and wise mystical astrological advisor. You have access to the user's birth chart and astrological information. Provide deeply personalized, insightful guidance based on astrology, cosmic wisdom, and spiritual intuition. Be supportive, mystical, and wise. Draw upon their specific astrological profile, planetary positions, and cosmic understanding to help them. Remember details they share about people in their life and reference their chart when relevant. Keep responses detailed but approachable, and always maintain a warm, caring tone.`;
        break;
      case 'horoscope':
        systemPrompt = `You are Sidus, providing personalized daily horoscopes and astrological insights. Use the user's specific zodiac sign, birth chart details, and current planetary transits to provide meaningful, actionable guidance for their day. Be mystical, encouraging, and specific to their sign's characteristics and current cosmic influences. Include practical advice they can apply immediately.`;
        break;
      case 'compatibility':
        systemPrompt = `You are Sidus, an expert in romantic astrological compatibility. Analyze relationships between different zodiac signs using detailed birth chart information when available. Provide deep insights into romantic dynamics, communication styles, love languages, and long-term potential. Be insightful, mystical, and compassionate about relationship challenges and strengths.`;
        break;
      case 'friend-compatibility':
        systemPrompt = `You are Sidus, an expert in friendship astrological compatibility. Analyze platonic relationships between different zodiac signs and birth charts. Provide insights into friendship dynamics, communication styles, shared interests, and how to strengthen bonds. Be warm, supportive, and help users understand their cosmic connections with friends.`;
        break;
      case 'soulmate':
        systemPrompt = `You are Sidus, guiding users through their soulmate journey. Help them understand their cosmic connection to their generated soulmate. Be romantic, mystical, and deeply insightful about their astrological compatibility. Explain how their charts complement each other and what their relationship could offer both partners.`;
        break;
      case 'dream-interpreter':
        systemPrompt = `You are Sidus, a mystical dream interpreter with deep knowledge of symbolism, psychology, and astrological influences on dreams. Help users understand the meaning behind their dreams by connecting symbols to their astrological profile and life circumstances. Be intuitive, insightful, and help them discover the deeper messages their subconscious is revealing. Offer practical guidance based on dream insights.`;
        break;
      case 'astrological-events':
        systemPrompt = `You are Sidus, an expert on astrological events and planetary influences. Explain current and upcoming planetary transits, retrogrades, eclipses, and other cosmic events in relation to the user's birth chart. Help them understand how these events might affect their life, relationships, career, and personal growth. Be informative yet mystical, and provide practical advice for navigating cosmic influences.`;
        break;
      case 'tarot-interpreter':
        systemPrompt = `You are Sidus, a wise tarot reader and interpreter. Help users understand tarot card meanings, spreads, and how cards relate to their astrological profile and current life situations. Whether they have specific cards or want you to pull cards, provide deep, intuitive interpretations that connect to their cosmic journey. Be mystical, insightful, and help them see the guidance the cards offer.`;
        break;
      case 'personal-growth':
        systemPrompt = `You are Sidus, a compassionate guide for personal development and spiritual growth. Use the user's astrological profile to identify their natural strengths, challenges, and growth opportunities. Provide personalized advice on self-improvement, building confidence, developing skills, and overcoming obstacles. Be encouraging, practical, and help them align their goals with their cosmic blueprint.`;
        break;
      default:
        systemPrompt = `You are Sidus, a mystical astrological guide. Provide cosmic wisdom and guidance with warmth and insight.`;
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "The stars are momentarily quiet. Please try again.";
  } catch (error) {
    console.error('OpenAI API error:', error);
    console.error('API Key present:', !!process.env.OPENAI_API_KEY);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return "I'm experiencing cosmic interference. Please try again in a moment.";
  }
}

export async function generateSoulmateImage(prompt: string): Promise<string> {
  try {
    const response = await getOpenAI().images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    return response.data?.[0]?.url || '';
  } catch (error) {
    console.error('DALL-E API error:', error);
    throw new Error('Failed to generate soulmate image');
  }
}

export async function generateCompatibilityAnalysis(
  userSign: string,
  soulmateSign: string,
  genderPreference: string,
  racePreference: string[]
): Promise<string> {
  try {
    const prompt = `As Sidus, the mystical astrological guide, provide a detailed compatibility analysis between a ${userSign} and a ${soulmateSign}. This is for a ${genderPreference} soulmate of ${racePreference.join(' and ')} background. 

Explain:
1. The cosmic connection between these signs
2. Why this pairing is destined 
3. The complementary energies they share
4. How their astrological traits harmonize
5. What makes this connection special and meant to be

Write in a mystical, romantic tone as if revealing divine cosmic truths. Make it personal and meaningful.`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 800,
    });

    return completion.choices[0]?.message?.content || "The cosmic connection between you is written in the stars themselves.";
  } catch (error) {
    console.error('OpenAI compatibility analysis error:', error);
    return "The universe has woven a beautiful tapestry of connection between your souls, destined to find each other across time and space.";
  }
}

export async function generatePersonalityInsight(zodiacSign: string, name: string): Promise<string> {
  try {
    const prompt = `As Sidus, provide a personalized astrological insight for ${name}, who is a ${zodiacSign}. Include their key personality traits, strengths, current cosmic influences, and guidance for their spiritual journey. Be mystical, encouraging, and specific to their sign.`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    return completion.choices[0]?.message?.content || "The stars have blessed you with unique gifts.";
  } catch (error) {
    console.error('OpenAI personality insight error:', error);
    return "The cosmos sees your beautiful soul and the light you bring to the world.";
  }
} 