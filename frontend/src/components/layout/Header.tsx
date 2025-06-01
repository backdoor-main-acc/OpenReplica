import React from 'react'
import { motion } from 'framer-motion'
import {
  BellIcon,
  UserCircleIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { useConnection, useSession, useAppStore } from '../../stores/appStore'

const Header: React.FC = () => {
  const { connected } = useConnection()
  const { currentSessionId } = useSession()
  const { selectedAgent, llmProvider, llmModel } = useAppStore()

  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 px-6 flex items-center justify-between">
      {/* Left Section - Session Info */}
      <div className="flex items-center space-x-4">
        {currentSessionId && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div>
              <p className="text-sm font-medium text-white">Session Active</p>
              <p className="text-xs text-slate-400">ID: {currentSessionId.slice(0, 8)}...</p>
            </div>
          </motion.div>
        )}
        
        {selectedAgent && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-slate-700 rounded-full">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-300">{selectedAgent}</span>
          </div>
        )}
      </div>

      {/* Center Section - LLM Info */}
      <div className="flex items-center space-x-4">
        {llmProvider && llmModel && (
          <div className="flex items-center space-x-3 px-4 py-2 bg-slate-700/50 rounded-lg">
            <div className="text-xs">
              <span className="text-slate-400">LLM:</span>
              <span className="text-white ml-1">{llmProvider}</span>
              <span className="text-slate-400 mx-1">/</span>
              <span className="text-blue-400">{llmModel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Section - Status & Controls */}
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <motion.div
          className="flex items-center space-x-2"
          animate={{
            scale: connected ? 1 : [1, 1.1, 1],
          }}
          transition={{
            repeat: connected ? 0 : Infinity,
            duration: 2,
          }}
        >
          {connected ? (
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-400">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Disconnected</span>
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-600"></div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <BellIcon className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </button>

        {/* User Menu */}
        <button className="flex items-center space-x-2 p-2 text-slate-400 hover:text-white transition-colors">
          <UserCircleIcon className="w-6 h-6" />
          <span className="text-sm">User</span>
        </button>
      </div>
    </header>
  )
}

export default Header
