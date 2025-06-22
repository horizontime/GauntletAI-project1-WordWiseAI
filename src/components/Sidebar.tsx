import { NavLink } from 'react-router-dom'
import { FileTextIcon, ClockIcon, TrashIcon, UserIcon, LogOutIcon, SettingsIcon, Sparkles } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export function Sidebar() {
  const { signOut, user } = useAuthStore()
  const navItems = [
    { name: 'Documents', to: '/dashboard', Icon: FileTextIcon },
    { name: 'Version History', to: '/version-history', Icon: ClockIcon },
    { name: 'Trash', to: '/trash', Icon: TrashIcon },
    { name: 'Settings', to: '/account', Icon: SettingsIcon },
  ]

  const isDemoUser = user && (!user.email || user.email === 'demo@wordwise.ai')

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-50 to-slate-100 border-r-0 min-h-screen flex flex-col shadow-xl relative z-50">
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            WordWise AI
          </span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ name, to, Icon }) => (
          <NavLink
            key={name}
            to={to}
            className={({ isActive }) =>
              `group flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-150
              ${isActive 
                ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 shadow-sm' 
                : 'text-gray-700 hover:bg-white/60 hover:text-gray-900'}`
            }
          >
            <Icon
              className="w-5 h-5 mr-3 flex-shrink-0"
              aria-hidden="true"
            />
            {name}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        {/* User profile section */}
        <div className="flex items-center p-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium mr-3">
            {isDemoUser ? 'G' : (user?.email?.[0]?.toUpperCase() || 'U')}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {isDemoUser ? 'Guest User' : user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500">
              {isDemoUser ? 'Demo Account' : user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        
        <button
          onClick={signOut}
          className="w-full inline-flex items-center justify-center px-4 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-white/60 text-sm font-medium transition-all duration-150"
        >
          <LogOutIcon className="w-4 h-4 mr-2" />
          Sign out
        </button>
      </div>
    </aside>
  )
} 