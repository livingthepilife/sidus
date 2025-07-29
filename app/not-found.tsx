import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
        </div>
        
        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white">404</h1>
          <h2 className="text-2xl font-semibold text-gray-300">Page Not Found</h2>
          <p className="text-gray-400 leading-relaxed">
            The cosmic pathway you're looking for seems to have drifted into the void. 
            Let's guide you back to familiar stars.
          </p>
        </div>
        
        {/* Actions */}
        <div className="space-y-4">
          <Link href="/app">
            <Button className="w-full bg-white text-black hover:bg-gray-200 rounded-full py-3 text-lg font-medium">
              Return to Sidus
            </Button>
          </Link>
          
          <Link href="/" className="block">
            <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 rounded-full py-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 