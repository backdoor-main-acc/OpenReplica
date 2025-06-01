import React from 'react'
import { motion } from 'framer-motion'
import {
  CpuChipIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'

interface AgentStatusProps {
  isRunning: boolean
  agentType?: string
  connected: boolean
  stats?: {
    tasksCompleted?: number
    uptime?: number
    memoryUsage?: number
  }
}

const AgentStatus: React.FC<AgentStatusProps> = ({ 
  isRunning, 
  agentType, 
  connected,
  stats = {} 
}) => {
  const getStatusColor = () => {
    if (!connected) return 'text-red-400'
    if (isRunning) return 'text-green-400'
    return 'text-yellow-400'
  }

  const getStatusText = () => {
    if (!connected) return 'Disconnected'
    if (isRunning) return 'Running'
    return 'Idle'
  }

  const getStatusIcon = () => {
    if (!connected) return ExclamationTriangleIcon
    if (isRunning) return BoltIcon
    return CheckCircleIcon
  }

  const StatusIcon = getStatusIcon()

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <motion.div
      className="flex items-center space-x-3 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        <motion.div
          className={`w-2 h-2 rounded-full ${
            !connected ? 'bg-red-500' : isRunning ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          animate={{
            scale: isRunning ? [1, 1.2, 1] : 1,
          }}
          transition={{
            repeat: isRunning ? Infinity : 0,
            duration: 2,
          }}
        />
        <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Agent Type */}
      {agentType && (
        <>
          <div className="w-px h-4 bg-slate-600"></div>
          <div className="flex items-center space-x-1">
            <CpuChipIcon className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">{agentType}</span>
          </div>
        </>
      )}

      {/* Connection Status */}
      <div className="w-px h-4 bg-slate-600"></div>
      <div className="flex items-center space-x-1">
        <WifiIcon className={`w-4 h-4 ${connected ? 'text-green-400' : 'text-red-400'}`} />
        <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {/* Stats (when running) */}
      {isRunning && connected && (
        <>
          <div className="w-px h-4 bg-slate-600"></div>
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            {stats.tasksCompleted !== undefined && (
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="w-3 h-3" />
                <span>{stats.tasksCompleted}</span>
              </div>
            )}
            {stats.uptime !== undefined && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-3 h-3" />
                <span>{formatUptime(stats.uptime)}</span>
              </div>
            )}
            {stats.memoryUsage !== undefined && (
              <div className="flex items-center space-x-1">
                <span>RAM: {stats.memoryUsage}%</span>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}

export default AgentStatus
