import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CpuChipIcon,
  EyeIcon,
  CodeBracketIcon,
  CommandLineIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline'
import { useWebSocket } from '../../services/websocket'

interface AgentActivity {
  id: string
  timestamp: Date
  type: 'action' | 'observation' | 'thought'
  content: string
  status: 'pending' | 'running' | 'completed' | 'error'
  details?: any
}

interface AgentActivityPanelProps {
  sessionId: string
  isAgentRunning: boolean
}

const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({
  sessionId,
  isAgentRunning
}) => {
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [currentThought, setCurrentThought] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const { on } = useWebSocket(sessionId)

  useEffect(() => {
    if (!sessionId) return

    // Listen for various agent events
    const unsubscribeAction = on('agent_action', (data) => {
      const activity: AgentActivity = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'action',
        content: data.data?.action || 'Agent action',
        status: 'running',
        details: data.data
      }
      setActivities(prev => [...prev, activity])
    })

    const unsubscribeObservation = on('agent_observation', (data) => {
      const activity: AgentActivity = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'observation',
        content: data.data?.content || 'Agent observation',
        status: 'completed',
        details: data.data
      }
      setActivities(prev => [...prev, activity])
    })

    const unsubscribeThought = on('agent_thought', (data) => {
      setCurrentThought(data.data?.thought || data.data?.content)
      
      if (data.data?.thought) {
        const activity: AgentActivity = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: 'thought',
          content: data.data.thought,
          status: 'completed',
          details: data.data
        }
        setActivities(prev => [...prev, activity])
      }
    })

    const unsubscribeError = on('agent_error', (data) => {
      const activity: AgentActivity = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'action',
        content: data.data?.error || 'Agent error',
        status: 'error',
        details: data.data
      }
      setActivities(prev => [...prev, activity])
    })

    return () => {
      unsubscribeAction()
      unsubscribeObservation()
      unsubscribeThought()
      unsubscribeError()
    }
  }, [sessionId, on])

  const getActivityIcon = (activity: AgentActivity) => {
    switch (activity.type) {
      case 'action':
        return CodeBracketIcon
      case 'observation':
        return EyeIcon
      case 'thought':
        return CpuChipIcon
      default:
        return ClockIcon
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircleIcon
      case 'error':
        return ExclamationCircleIcon
      case 'running':
        return PlayIcon
      default:
        return ClockIcon
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'running':
        return 'text-blue-400'
      default:
        return 'text-yellow-400'
    }
  }

  const clearActivities = () => {
    setActivities([])
    setCurrentThought(null)
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700">
      {/* Header */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <CpuChipIcon className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-white">Agent Activity</span>
          <div className={`w-2 h-2 rounded-full ${isAgentRunning ? 'bg-green-500' : 'bg-gray-500'}`}></div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            {isExpanded ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={clearActivities}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Current Thought */}
      <AnimatePresence>
        {currentThought && isAgentRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-purple-900/30 border-b border-purple-700/50 p-3"
          >
            <div className="flex items-start space-x-2">
              <CpuChipIcon className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-purple-300 mb-1">Agent is thinking...</div>
                <div className="text-sm text-white">{currentThought}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <CpuChipIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No agent activity yet</p>
              <p className="text-slate-600 text-xs mt-1">Start an agent to see actions and thoughts</p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            <AnimatePresence>
              {activities.slice(-20).reverse().map((activity) => {
                const ActivityIcon = getActivityIcon(activity)
                const StatusIcon = getStatusIcon(activity.status)
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          activity.type === 'action' ? 'bg-blue-600/20' :
                          activity.type === 'observation' ? 'bg-green-600/20' :
                          'bg-purple-600/20'
                        }`}>
                          <ActivityIcon className={`w-4 h-4 ${
                            activity.type === 'action' ? 'text-blue-400' :
                            activity.type === 'observation' ? 'text-green-400' :
                            'text-purple-400'
                          }`} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${
                            activity.type === 'action' ? 'text-blue-300' :
                            activity.type === 'observation' ? 'text-green-300' :
                            'text-purple-300'
                          }`}>
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <StatusIcon className={`w-3 h-3 ${getStatusColor(activity.status)}`} />
                            <span className="text-xs text-slate-500">
                              {activity.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-white break-words">
                          {activity.content}
                        </p>
                        
                        {activity.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-8 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-4 text-xs">
        <span className="text-slate-400">
          {activities.length} activities
        </span>
        <span className="text-slate-500">
          OpenReplica Agent Monitor
        </span>
      </div>
    </div>
  )
}

export default AgentActivityPanel
