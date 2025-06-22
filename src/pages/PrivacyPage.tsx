import { Link } from 'react-router-dom'
import { Database, Eye, Users, Lock, Shield, Calendar, Mail, ArrowRight } from 'lucide-react'

type Section = {
  id: string
  title: string
  icon: React.FC<{ className?: string }>
  content: {
    subtitle: string
    text: string
  }[]
}

const sections: Section[] = [
  {
    id: 'information-collection',
    title: 'Information We Collect',
    icon: Database,
    content: [
      {
        subtitle: 'Personal Information',
        text:
          'We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This may include your name, email address, and any content you create using our platform.',
      },
      {
        subtitle: 'Usage Information',
        text:
          'We automatically collect information about how you use our services, including your interactions with documents, features used, and performance metrics to improve our AI suggestions.',
      },
      {
        subtitle: 'Device Information',
        text:
          'We collect information about the device you use to access our services, including hardware model, operating system, browser type, and IP address.',
      },
    ],
  },
  {
    id: 'information-use',
    title: 'How We Use Your Information',
    icon: Eye,
    content: [
      {
        subtitle: 'Service Provision',
        text:
          'We use your information to provide, maintain, and improve our writing assistance services, including generating AI-powered suggestions and maintaining your document history.',
      },
      {
        subtitle: 'Communication',
        text: 'We may use your contact information to send you technical notices, updates, security alerts, and administrative messages.',
      },
      {
        subtitle: 'Personalization',
        text: 'We use your usage patterns to personalize your experience and improve the relevance of our writing suggestions.',
      },
    ],
  },
  {
    id: 'information-sharing',
    title: 'Information Sharing',
    icon: Users,
    content: [
      {
        subtitle: 'No Sale of Personal Data',
        text: 'We do not sell, trade, or otherwise transfer your personal information to third parties for commercial purposes.',
      },
      {
        subtitle: 'Service Providers',
        text: 'We may share information with trusted service providers who assist us in operating our platform, conducting our business, or serving our users.',
      },
      {
        subtitle: 'Legal Requirements',
        text: 'We may disclose your information if required to do so by law or in response to valid requests by public authorities.',
      },
    ],
  },
  {
    id: 'data-security',
    title: 'Data Security',
    icon: Lock,
    content: [
      {
        subtitle: 'Encryption',
        text: 'We use industry-standard encryption to protect your data both in transit and at rest. All communications between your device and our servers are encrypted using TLS.',
      },
      {
        subtitle: 'Access Controls',
        text: 'We implement strict access controls and regularly audit our systems to ensure only authorized personnel can access user data.',
      },
      {
        subtitle: 'Regular Updates',
        text: 'We regularly update our security measures and conduct security assessments to protect against emerging threats.',
      },
    ],
  },
]

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WordWise AI
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center text-gray-700 hover:text-gray-900 transition-colors text-sm"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 mb-6 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4 mr-2" /> Privacy & Security
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information when
            you use WordWise AI.
          </p>
          <div className="flex items-center justify-center mt-6 text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" /> Last updated: December 21, 2024
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <section.icon className="w-5 h-5 text-blue-600 mr-3" />
              <span className="text-sm font-medium text-gray-700">{section.title}</span>
            </a>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-lg p-8">
              <div className="flex items-center mb-6 space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
              </div>
              <div className="space-y-8">
                {section.content.map((item, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">{item.subtitle}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-10 text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Questions About Our Privacy Policy?</h2>
          <p className="text-lg mb-6 opacity-90">
            If you have any questions about this Privacy Policy, please don\'t hesitate to contact us.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Mail className="w-5 h-5 mr-2" /> Contact Us <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WordWise AI
            </span>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="hover:text-gray-900 font-medium">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-gray-900">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
} 