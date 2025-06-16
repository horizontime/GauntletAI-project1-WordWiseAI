import { NavLink } from 'react-router-dom'
import { FileTextIcon, ClockIcon, TrashIcon, UserIcon } from 'lucide-react'

export function Sidebar() {
  const navItems = [
    { name: 'Documents', to: '/dashboard', Icon: FileTextIcon },
    { name: 'Version History', to: '/version-history', Icon: ClockIcon },
    { name: 'Trash', to: '/trash', Icon: TrashIcon },
    { name: 'Account', to: '/account', Icon: UserIcon },
  ]

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
      <div className="px-6 py-4 border-b">
        <h1 className="text-xl font-bold text-gray-900">WordWise AI</h1>
      </div>
      <nav className="flex-1 py-6 px-2 space-y-1">
        {navItems.map(({ name, to, Icon }) => (
          <NavLink
            key={name}
            to={to}
            className={({ isActive }) =>
              `group flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`
            }
          >
            <Icon
              className="w-4 h-4 mr-3 flex-shrink-0"
              aria-hidden="true"
            />
            {name}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
} 