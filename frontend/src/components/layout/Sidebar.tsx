import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  CogIcon,
  CommandLineIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  ChartBarIcon,
  CpuChipIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useUI, useSession } from '../../stores/appStore'

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useUI()
  const { currentSessionId } = useSession()
  const location = useLocation()

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: HomeIcon,
      exact: true,
    },
    {
      name: 'Workspace',
      href: currentSessionId ? `/workspace/${currentSessionId}` : '/workspace',
      icon: CommandLineIcon,
    },
    {
      name: 'Microagents',
      href: '/microagents',
      icon: CpuChipIcon,
    },
    {
      name: 'Agents',
      href: '/agents',
      icon: UserGroupIcon,
    },
    {
      name: 'Files',
      href: '/files',
      icon: FolderIcon,
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
    },
  ]

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="h-full bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">OpenReplica</h1>
                <p className="text-xs text-slate-400">AI Development Platform</p>
              </div>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {sidebarCollapsed ? (
              <Bars3Icon className="w-5 h-5 text-slate-400" />
            ) : (
              <XMarkIcon className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`
                relative flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }
              `}
            >
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-600 rounded-lg"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
              )}
              <Icon className={`
                w-5 h-5 relative z-10
                ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}
              `} />
              {!sidebarCollapsed && (
                <span className="relative z-10">{item.name}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-slate-400 text-center"
          >
            OpenReplica v1.0.0
            <br />
            Enhanced OpenHands
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
