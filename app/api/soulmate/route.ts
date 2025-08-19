import { NextRequest, NextResponse } from "next/server";
import {
  generateSoulmateImage,
  generateCompatibilityAnalysis,
} from "@/lib/openai";
import { getCompatibilityScore, generateSoulmatePrompt } from "@/lib/utils";
import { ZodiacSign } from "@/types";
import {
  uploadImageToR2,
  generateSoulmateImageFileName,
} from "@/lib/r2-upload";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

// Use service role key if available, otherwise fall back to anon key
const supabaseKey =
  supabaseServiceKey && supabaseServiceKey !== "your_service_role_key_here"
    ? supabaseServiceKey
    : supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

// If using anon key, we need to temporarily disable RLS for this to work
const isUsingServiceRole =
  supabaseServiceKey && supabaseServiceKey !== "your_service_role_key_here";

export async function POST(request: NextRequest) {
  try {
    console.log("=== SOULMATE API CALLED ===");
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );

    // Get parameters from request body
    const { userSign, genderPreference, racePreference } = await request.json();

    console.log("Received parameters:", {
      userSign,
      genderPreference,
      racePreference,
    });

    if (!userSign || !genderPreference || !racePreference) {
      console.log("Missing required parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log("Using service role key:", isUsingServiceRole);

    console.log("Checking authentication...");
    
    // Try to get user from session first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("Auth result:", { user: user?.id, error: authError });

    let finalUserId = user?.id;

    // If no session user, try to get from Authorization header
    if (!finalUserId) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7);
          const { data: tokenUser, error: tokenError } =
            await supabase.auth.getUser(token);
          if (tokenUser.user) {
            finalUserId = tokenUser.user.id;
            console.log("Using token user ID:", finalUserId);
          }
        } catch (e) {
          console.log("Token auth failed:", e);
        }
      }
    }

    // If still no user ID, try to extract from request body or cookies
    if (!finalUserId) {
      console.log("No authenticated user found via standard methods");
      // For development/testing, we'll return an error instead of using temp user
      return NextResponse.json(
        { error: "Authentication required. Please log in to generate a soulmate." },
        { status: 401 }
      );
    }

    console.log("Using authenticated user ID:", finalUserId);

    const { data: recentSoulmate, error: checkError } = await supabase
      .from("soulmates")
      .select("id, created_at")
      .eq("user_id", finalUserId)
      .gte("created_at", new Date(Date.now() - 5000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (recentSoulmate && !checkError) {
      console.log("Recent soulmate found, preventing duplicate generation");
      return NextResponse.json(
        { error: "Please wait a moment before generating another soulmate" },
        { status: 429 }
      );
    }

    // Generate random compatible zodiac signs for soulmate
    const zodiacSigns: ZodiacSign[] = [
      "Aries",
      "Taurus",
      "Gemini",
      "Cancer",
      "Leo",
      "Virgo",
      "Libra",
      "Scorpio",
      "Sagittarius",
      "Capricorn",
      "Aquarius",
      "Pisces",
    ];

    // Generate random signs for sun, moon, and rising
    const sunSign = zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];
    const moonSign =
      zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];
    const risingSign =
      zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];

    // Use sun sign as the main soulmate sign
    const soulmateSign = sunSign;

    // Generate the soulmate image prompt
    const prompt = generateSoulmatePrompt(
      userSign,
      genderPreference,
      racePreference
    );
    console.log("Generated prompt:", prompt);

    // Generate the image
    console.log("Generating image...");
    const openaiImageUrl = await generateSoulmateImage(prompt);
    console.log("Image generated:", openaiImageUrl);

    // Upload image to R2 and get CDN URL
    console.log("Uploading image to R2...");
    const fileName = await generateSoulmateImageFileName();
    const cdnImageUrl = await uploadImageToR2(openaiImageUrl, fileName);
    console.log("Image uploaded to R2:", cdnImageUrl);

    // Calculate compatibility score (90-100% for soulmates)
    const baseScore = getCompatibilityScore(userSign, soulmateSign);
    const soulmateScore = Math.floor(Math.random() * 11) + 90; // Random between 90-100
    const compatibilityScore = soulmateScore;

    // Generate compatibility analysis
    const analysis = await generateCompatibilityAnalysis(
      userSign,
      soulmateSign,
      genderPreference,
      racePreference
    );

    // Generate short description
    const shortDescription = `Your passion meets their fiery ${soulmateSign} spirit, igniting thrilling adventures, while your shared ${risingSign} rising fosters an intense emotional bond, creating an unbreakable connection.`;

    // Store the soulmate directly in Supabase
    console.log("Storing soulmate in database for user:", finalUserId);

    try {
      const { data: soulmateData, error: insertError } = await supabase
        .from("soulmates")
        .insert({
          user_id: finalUserId,
          personal_info: {
            name: "Your Soulmate",
            gender: genderPreference,
            ethnicity: racePreference,
          },
          astrological_info: {
            sun_sign: sunSign,
            moon_sign: moonSign,
            rising_sign: risingSign,
            soulmate_sign: soulmateSign,
          },
          compatibility_info: {
            compatibility_score: compatibilityScore,
            analysis: analysis,
            short_description: shortDescription,
          },
          image_url: cdnImageUrl,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting soulmate:", insertError);
        console.error("Error details:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        // Return error if database storage fails
        return NextResponse.json(
          { error: `Failed to store soulmate: ${insertError.message}` },
          { status: 500 }
        );
      } else {
        console.log("Soulmate stored successfully:", soulmateData);
      }
    } catch (dbError) {
      console.error("Database storage failed:", dbError);
      return NextResponse.json(
        { error: "Failed to store soulmate in database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: cdnImageUrl,
        soulmateSign,
        compatibilityScore,
        analysis,
        sunSign,
        moonSign,
        risingSign,
        shortDescription,
      },
    });
  } catch (error) {
    console.error("Soulmate generation error:", error);
    let errorMessage = "Failed to generate soulmate";

    if (error instanceof Error) {
      if (error.message.includes("OPENAI_API_KEY")) {
        errorMessage = "OpenAI API configuration error";
      } else if (error.message.includes("Failed to upload image")) {
        errorMessage = "Image upload failed";
      } else if (error.message.includes("Failed to generate soulmate image")) {
        errorMessage = "Image generation failed";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("=== GET SOULMATE API CALLED ===");
    
    // Get user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (!user || authError) {
      console.log("No authenticated user found for GET request");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Fetching soulmate for user:", user.id);

    // Get the user's most recent soulmate
    const { data: soulmateData, error: fetchError } = await supabase
      .from("soulmates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No soulmate found
        console.log("No soulmate found for user");
        return NextResponse.json({
          success: true,
          data: null
        });
      }
      console.error("Error fetching soulmate:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch soulmate" },
        { status: 500 }
      );
    }

    console.log("Found soulmate:", soulmateData);
    return NextResponse.json({
      success: true,
      data: soulmateData
    });

  } catch (error) {
    console.error("Soulmate fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch soulmate" },
      { status: 500 }
    );
  }
}
