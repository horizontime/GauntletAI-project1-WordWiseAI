import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="w-full sticky top-0 z-40 bg-white/80 backdrop-blur py-4 px-6 sm:px-10 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-2xl font-bold text-primary-600">WordWise AI</h1>
        <Link
          to="/auth"
          className="inline-block rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Get Started Free
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center flex-1 px-6 py-20 bg-gradient-to-b from-primary-50 to-white">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 max-w-3xl">
          Write&nbsp;With&nbsp;Confidence.
        </h2>
        <p className="mt-6 max-w-xl text-lg text-gray-600">
          WordWise&nbsp;AI gives you actionable, AI-powered guidance. You learn <em>why </em>
          each edit matters and level-up your writing skills, fast.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-block rounded-md bg-primary-600 px-8 py-3 text-base font-semibold text-white shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Try It Free
        </Link>
      </section>

      {/* Problem / Solution */}
      <section className="px-6 sm:px-10 py-16 max-w-5xl mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
          Falling behind on essays and assignments?
        </h3>
        <p className="mt-4 text-gray-600 text-center max-w-3xl mx-auto">
          Traditional spell-checkers simply flag mistakes. They don't teach you how to
          avoid them next time. WordWise&nbsp;AI acts like a personal writing coach,
          explaining <strong>what</strong> to fix and, more importantly, <strong>why</strong>,
          so every suggestion helps you grow.
        </p>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 grid gap-10 md:grid-cols-3 text-center">
          {/* Clarity */}
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Clarity Suggestions</h4>
            <p className="text-gray-600">
              Replace vague sentences with precise language that makes your
              argument easy to follow.
            </p>
          </div>
          {/* Engagement */}
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Engagement Boosts</h4>
            <p className="text-gray-600">
              Transform dull passages into compelling narratives that keep
              readers hooked from start to finish.
            </p>
          </div>
          {/* Delivery */}
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Delivery Refinements</h4>
            <p className="text-gray-600">
              Fine-tune tone and style for polished, professional writing that
              leaves a lasting impression.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-6 sm:px-10 py-16 max-w-3xl mx-auto text-center">
        <blockquote className="text-xl font-medium text-gray-900">
          "WordWise AI didn't just fix my grammar, it showed me <em>why</em> my
          sentences were confusing. My grades shot up, and writing no longer
          scares me."
        </blockquote>
        <cite className="mt-4 block text-sm text-gray-600">— Maya R., First-year University Student</cite>
      </section>

      {/* Final CTA */}
      <section className="bg-primary-600 py-16 flex flex-col items-center text-center px-6">
        <h3 className="text-3xl sm:text-4xl font-bold text-white max-w-2xl">
          Ready to unlock your full writing potential?
        </h3>
        <p className="mt-4 text-white/90 max-w-xl">
          Start your free session now—no credit card required.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-block rounded-md bg-white px-8 py-3 text-base font-semibold text-primary-600 shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
        >
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 bg-white border-t border-gray-100">
        © {new Date().getFullYear()} WordWise&nbsp;AI. All rights reserved.
      </footer>
    </div>
  )
} 