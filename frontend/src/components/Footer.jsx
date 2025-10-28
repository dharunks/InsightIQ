import { Link } from 'react-router-dom'
import { Github, Linkedin, Twitter, Mail } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IQ</span>
                </div>
                <span className="text-xl font-bold text-gray-900">InsightIQ</span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                InsightIQ helps you master technical interviews through AI-powered practice sessions and detailed performance analysis.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/interviews" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Interviews
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Analytics
                  </Link>
                </li>
                <li>
                  <Link to="/gamification" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Journey
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Legal
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} InsightIQ. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-500 text-sm">
                Made with ❤️ for developers worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer