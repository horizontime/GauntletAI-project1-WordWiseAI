import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Sparkles, Target, Zap, Users, Star } from 'lucide-react'

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

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 bg-white/50 backdrop-blur-sm">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the plan that works best for you. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 bg-white rounded-lg flex flex-col">
            <div className="p-8 text-center flex flex-col flex-grow">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-left flex-grow">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Up to 3 documents</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Basic grammar checking</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Limited AI suggestions</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Email support</span>
                </li>
              </ul>
              <Link
                to="/auth"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg relative flex flex-col">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <div className="p-8 text-center flex flex-col flex-grow">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  $12
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-left flex-grow">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Unlimited documents</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Advanced AI suggestions</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Clarity & engagement tools</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Export to multiple formats</span>
                </li>
              </ul>
              <Link
                to="/auth"
                className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                Start Pro Trial
              </Link>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 bg-white rounded-lg flex flex-col">
            <div className="p-8 text-center flex flex-col flex-grow">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Enterprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$49</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-left flex-grow">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Everything in Pro</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Team collaboration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Custom style guides</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Admin dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600">24/7 phone support</span>
                </li>
              </ul>
              <Link
                to="/contact"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">All plans include a 14-day free trial. No credit card required.</p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span>30-day money back guarantee</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span>Secure payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">About WordWise AI</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're on a mission to help everyone become a better writer through the power of artificial intelligence.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              At WordWise AI, we believe that great writing should be accessible to everyone. Our advanced AI technology
              doesn't just correct your mistakes—it teaches you why changes matter, helping you become a more confident
              and skilled writer.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Founded in 2023 by a team of linguists, AI researchers, and educators, we've helped over 50,000 writers
              improve their skills and achieve their goals.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">1M+</div>
                <div className="text-gray-600">Documents Improved</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">AI-Powered Writing Excellence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold mb-12 text-center text-gray-900">Meet Our Team</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white rounded-lg p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">SJ</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Sarah Johnson</h4>
              <p className="text-blue-600 font-medium mb-3">CEO & Co-Founder</p>
              <p className="text-gray-600 text-sm">
                Former linguistics professor with 15 years of experience in educational technology.
              </p>
            </div>

            <div className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white rounded-lg p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">MC</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Michael Chen</h4>
              <p className="text-purple-600 font-medium mb-3">CTO & Co-Founder</p>
              <p className="text-gray-600 text-sm">
                AI researcher and former Google engineer specializing in natural language processing.
              </p>
            </div>

            <div className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white rounded-lg p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">ER</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Emily Rodriguez</h4>
              <p className="text-green-600 font-medium mb-3">Head of Product</p>
              <p className="text-gray-600 text-sm">
                UX designer and educator focused on making AI tools accessible to everyone.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Accuracy</h3>
            <p className="text-gray-600 leading-relaxed">
              We're committed to providing the most accurate and helpful writing suggestions powered by cutting-edge
              AI.
            </p>
          </div>

          <div className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Accessibility</h3>
            <p className="text-gray-600 leading-relaxed">
              Great writing tools should be available to everyone, regardless of their background or experience level.
            </p>
          </div>

          <div className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Innovation</h3>
            <p className="text-gray-600 leading-relaxed">
              We continuously push the boundaries of what's possible with AI to create better writing experiences.
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