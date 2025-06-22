import { Link } from 'react-router-dom'
import { Mail, Phone, MessageSquare, MapPin, Clock, Send, ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help via email within 24 hours',
    contact: 'support@wordwise.ai',
    color: 'blue',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with our support team',
    contact: 'Available 9 AM - 6 PM EST',
    color: 'green',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly with our team',
    contact: '+1 (555) 123-4567',
    color: 'purple',
  },
]

export function ContactPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, submit to backend or third-party service.
    alert('Message sent! (demo)')
    setForm({ firstName: '', lastName: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WordWise AI
            </span>
          </Link>
          <Link to="/" className="inline-flex items-center text-gray-700 hover:text-gray-900 transition-colors text-sm">
            Back to Home
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 mb-6 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <MessageSquare className="w-4 h-4 mr-2" /> Get in Touch
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions about WordWise AI? Need help with your account? We're here to help! Reach out to our friendly
            support team.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-6">
              <Send className="w-6 h-6 mr-3 text-blue-600" /> Send us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="h-12 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 px-3"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="h-12 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 px-3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="h-12 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 px-3"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  id="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  className="h-12 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 px-3"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Please describe your question or issue in detail..."
                  className="min-h-[120px] w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 px-3 py-2 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center"
              >
                Send Message <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </form>
          </div>

          {/* Contact Info & Office */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get in Touch</h3>
              {contactMethods.map((method, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div
                    className={`p-3 rounded-lg ${
                      method.color === 'blue'
                        ? 'bg-blue-100'
                        : method.color === 'green'
                        ? 'bg-green-100'
                        : 'bg-purple-100'
                    }`}
                  >
                    <method.icon
                      className={`w-5 h-5 ${
                        method.color === 'blue'
                          ? 'text-blue-600'
                          : method.color === 'green'
                          ? 'text-green-600'
                          : 'text-purple-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{method.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">{method.description}</p>
                    <p className="text-sm font-medium text-gray-900">{method.contact}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Office Info */}
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-gray-700" /> Headquarters
              </h3>
              <p className="text-gray-600 whitespace-pre-line">123 Innovation Drive
San Francisco, CA 94105</p>

              <div className="h-px bg-gray-200" />

              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-700" /> Business Hours
              </h3>
              <p className="text-gray-600">Monday - Friday: 9 AM - 6 PM EST</p>
              <p className="text-gray-600">Weekends: 10 AM - 4 PM EST</p>
            </div>
          </div>
        </div>

        {/* Response Time Notice */}
        <div className="mt-16 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg flex items-start space-x-3">
          <Clock className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div className="text-blue-800 space-y-1">
            <h3 className="text-lg font-semibold mb-2">Response Times</h3>
            <p><strong>General Inquiries:</strong> Within 24 hours</p>
            <p><strong>Technical Support:</strong> Within 4-8 hours</p>
            <p><strong>Billing Questions:</strong> Within 2-4 hours</p>
            <p><strong>Urgent Issues:</strong> Within 1-2 hours</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WordWise AI
            </span>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="hover:text-gray-900">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-gray-900">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-gray-900 font-medium">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
} 