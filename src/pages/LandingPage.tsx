import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Sparkles, Target, Zap, Users, Star, Play } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WordWise AI
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/auth" className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link
              to="/auth?demo=true"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center px-3 py-1 mb-6 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          <Sparkles className="w-4 h-4 mr-2" />
          AI-Powered Writing Assistant
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
          Write With
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Confidence</span>
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          WordWise AI gives you actionable, AI-powered guidance. You learn{" "}
          <span className="font-semibold text-blue-600">why</span> each edit matters and level-up your writing skills,
          fast.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/auth?demo=true"
            className="inline-flex items-center px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
          >
            Try It Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <button className="inline-flex items-center px-8 py-3 text-lg border-2 border-gray-300 text-gray-700 rounded-md hover:border-gray-400 transition-all duration-200">
            <Play className="mr-2 w-5 h-5" />
            Watch Demo
          </button>
        </div>

        {/* Social Proof */}
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 mb-16">
          <div className="flex items-center space-x-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="ml-2">4.9/5 from 10k+ users</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Trusted by 50k+ writers</span>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            Falling behind on essays and assignments?
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Traditional spell-checkers simply flag mistakes. They don't teach you how to avoid them next time. WordWise
            AI acts like a personal writing coach, explaining <span className="font-semibold text-blue-600">what</span>{" "}
            to fix and, more importantly, <span className="font-semibold text-purple-600">why</span>, so every
            suggestion helps you grow.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Powerful Features for Better Writing</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to write with confidence and improve your skills
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Clarity Suggestions</h3>
            <p className="text-gray-600 leading-relaxed">
              Replace vague sentences with precise language that makes your argument easy to follow.
            </p>
          </div>

          <div className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Engagement Boosts</h3>
            <p className="text-gray-600 leading-relaxed">
              Transform dull passages into compelling narratives that keep readers hooked from start to finish.
            </p>
          </div>

          <div className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Delivery Refinements</h3>
            <p className="text-gray-600 leading-relaxed">
              Fine-tune tone and style for polished, professional writing that leaves a lasting impression.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="border-0 shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Writing?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of writers who've improved their skills with WordWise AI
          </p>
          <Link
            to="/auth?demo=true"
            className="inline-flex items-center px-8 py-3 text-lg bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-all duration-200 shadow-sm"
          >
            Start Writing Better Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WordWise AI
              </span>
            </div>
            <div className="flex space-x-6 text-gray-600">
              <Link to="/privacy" className="hover:text-gray-900 transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-gray-900 transition-colors">
                Terms
              </Link>
              <Link to="/contact" className="hover:text-gray-900 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 