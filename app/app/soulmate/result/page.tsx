"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MoreVertical,
  ArrowRight,
  Heart,
  Star,
  Moon,
  Sun,
  TrendingUp,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SoulmateResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const imageUrl = searchParams.get("imageUrl") || "";
  const compatibility = searchParams.get("compatibility") || "95";
  const soulmateSign = searchParams.get("soulmateSign") || "Aries";
  const analysis = searchParams.get("analysis") || "";
  const sunSign = searchParams.get("sunSign") || "Aries";
  const moonSign = searchParams.get("moonSign") || "Aries";
  const risingSign = searchParams.get("risingSign") || "Scorpio";
  const shortDescription = searchParams.get("shortDescription") || "";

  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Debug logging
  console.log("Soulmate Result Page - Image URL:", imageUrl);
  console.log("Soulmate Result Page - All params:", {
    imageUrl,
    compatibility,
    soulmateSign,
    analysis: analysis?.substring(0, 100) + "...",
    sunSign,
    moonSign,
    risingSign,
  });

  const handleBack = () => {
    router.push("/app/chat?type=soulmate");
  };

  const handleReset = async () => {
    setShowMenu(false);

    // Delete the current soulmate from database
    try {
      const response = await fetch("/api/soulmates", {
        method: "DELETE",
      });

      if (response.ok) {
        // Redirect to soulmate generation
        router.push("/app/chat?type=soulmate");
      } else {
        console.error("Failed to delete soulmate");
        // Still redirect even if deletion fails
        router.push("/app/chat?type=soulmate");
      }
    } catch (error) {
      console.error("Error deleting soulmate:", error);
      // Still redirect even if deletion fails
      router.push("/app/chat?type=soulmate");
    }
  };

  const handleLearnMore = () => {
    // Create a preset person for compatibility check
    const soulmatePerson = {
      name: "Your Soulmate",
      birthDate: "1995-03-21", // Example date
      birthTime: "12:00",
      birthLocation: "New York, NY",
      sunSign: sunSign,
      moonSign: moonSign,
      risingSign: risingSign,
      relationshipType: "soulmate",
    };

    // Store the soulmate data for compatibility check
    localStorage.setItem(
      "soulmateForCompatibility",
      JSON.stringify(soulmatePerson)
    );

    // Navigate to compatibility check
    router.push("/app/chat?type=compatibility&preset=soulmate");
  };

  const generateShortCompatibilityDescription = () => {
    // Get user's zodiac sign from localStorage
    const userData = localStorage.getItem("sidusUser");
    const userSign = userData ? JSON.parse(userData).zodiacSign : "Aquarius";

    // Generate concise, trait-focused descriptions
    const descriptions = [
      `Your ${userSign} passion meets their fiery ${sunSign} spirit, igniting thrilling adventures, while your shared ${risingSign} rising fosters an intense emotional bond, creating an unbreakable connection.`,
      `The magnetic attraction between ${userSign} and ${sunSign} creates extraordinary chemistry, with your ${moonSign} moon connection adding emotional depth to every shared moment.`,
      `Your ${userSign} energy perfectly complements their ${sunSign} nature, while your ${risingSign} rising ensures a connection that deepens with time and shared experiences.`,
      `The cosmic alignment of ${userSign} and ${sunSign} creates passionate harmony, with your ${moonSign} moon fostering intuitive understanding and emotional intimacy.`,
      `Your ${userSign} soul resonates with their ${sunSign} spirit, creating both passionate attraction and profound emotional connection through your ${risingSign} rising.`,
    ];

    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Your Soulmate</h1>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <MoreVertical className="w-6 h-6" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-12 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 min-w-48"
              >
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors rounded-lg border-b border-gray-700"
                >
                  Generate New Soulmate
                </button>
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors rounded-lg text-yellow-400 text-sm"
                >
                  Debug Image URL
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 pb-24 space-y-6 flex flex-col items-center justify-center max-w-md mx-auto">
          {/* Soulmate Image - Square Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden border-2 border-purple-500/40 w-72 h-72 bg-gradient-to-br from-purple-900/10 to-blue-900/10">
              <img
                src={imageUrl}
                alt="Your Soulmate"
                className="w-full h-full object-cover object-center"
                onLoad={() => {
                  setIsImageLoading(false);
                  setImageError(false);
                }}
                onError={(e) => {
                  console.error("Image failed to load:", imageUrl);
                  setImageError(true);
                  setIsImageLoading(false);
                  e.currentTarget.src =
                    "https://via.placeholder.com/400x400/1f2937/ffffff?text=Your+Soulmate";
                }}
              />

              {/* Loading indicator */}
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              )}

              {/* Error indicator */}
              {imageError && (
                <div className="absolute bottom-2 left-2 bg-red-500/80 text-white px-2 py-1 rounded text-xs">
                  Image failed to load
                </div>
              )}
            </div>
          </motion.div>

          {/* Compatibility Percentage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <div className="text-4xl font-bold text-white mb-4">
              {compatibility}% compatible
            </div>
          </motion.div>

          {/* Astrological Signs with Icons - Horizontal Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center space-x-6"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sun className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">{sunSign}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                <Moon className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">{moonSign}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">{risingSign}</span>
            </div>
          </motion.div>

          {/* Concise Compatibility Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center max-w-sm mx-auto px-4"
          >
            <p className="text-gray-300 leading-relaxed text-center">
              {shortDescription
                ? decodeURIComponent(shortDescription)
                : generateShortCompatibilityDescription()}
            </p>
          </motion.div>

          {/* Debug Info */}
          {showDebugInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 border border-yellow-500 rounded-lg p-4 max-w-md mx-auto"
            >
              <h4 className="text-yellow-400 font-semibold mb-2">
                Debug Information
              </h4>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-gray-400">Image URL:</span>
                  <p className="text-white break-all">{imageUrl}</p>
                </div>
                <div>
                  <span className="text-gray-400">Image Status:</span>
                  <p className="text-white">
                    {isImageLoading
                      ? "Loading..."
                      : imageError
                      ? "Failed to load"
                      : "Loaded successfully"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(imageUrl);
                    alert("URL copied to clipboard");
                  }}
                  className="bg-yellow-500 text-black px-2 py-1 rounded text-xs"
                >
                  Copy URL
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom Action - Fixed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="fixed bottom-0 left-0 right-0 p-6 border-t border-gray-800 bg-black/95 backdrop-blur-sm"
        >
          <button
            onClick={handleLearnMore}
            className="w-full bg-white text-black hover:bg-gray-100 rounded-full py-4 text-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl active:scale-95"
          >
            <span>Tap to learn more</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
