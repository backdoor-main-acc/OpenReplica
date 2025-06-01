import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayIcon,
  StopIcon,
  PauseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CodeBracketIcon,
  CommandLineIcon,
  DocumentTextIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

interface ExecutionStep {
  id: string
  type: 'action' | 'observation' | 'thought'
  title: string
  content: string
  timestamp: Date
  status: 'pending' | 'running' | 'completed' | 'error'
  duration?: number
  details?: any
  children?: ExecutionStep[]
}

interface AgentExecutionTimelineProps {
  sessionId: string
  isAgentRunning: boolean
  onStepClick?: (step: ExecutionStep) => void
}

const AgentExecutionTimeline: React.FC<AgentExecutionTimelineProps> = ({
  sessionId,
  isAgentRunning,
  onStepClick
}) => {
  const [steps, setSteps] = useState<ExecutionStep[]>([])
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [currentStep, setCurrentStep] = useState<string | null>(null)

  // Mock data for demonstration - in real app, this would come from WebSocket
  useEffect(() => {
    if (isAgentRunning) {
      const mockSteps: ExecutionStep[] = [
        {
          id: '1',
          type: 'thought',
          title: 'Analyzing the user request',
          content: 'I need to understand what the user wants me to do. They want me to create a new React component...',
          timestamp: new Date(Date.now() - 30000),
          status: 'completed',
          duration: 2000,
        },
        {
          id: '2', 
          type: 'action',
          title: 'Reading project structure',
          content: 'str_replace_editor: view /workspace/src/components',
          timestamp: new Date(Date.now() - 25000),
          status: 'completed',
          duration: 1500,
          details: {
            tool: 'str_replace_editor',
            command: 'view',
            path: '/workspace/src/components'
          }
        },
        {
          id: '3',
          type: 'observation',
          title: 'Found existing components',
          content: 'The components directory contains: Header.tsx, Sidebar.tsx, WorkspacePanel.tsx...',
          timestamp: new Date(Date.now() - 23000),
          status: 'completed',
          duration: 500,
        },
        {
          id: '4',
          type: 'action',
          title: 'Creating new component file',
          content: 'str_replace_editor: create /workspace/src/components/NewComponent.tsx',
          timestamp: new Date(Date.now() - 20000),
          status: 'running',
          details: {
            tool: 'str_replace_editor',
            command: 'create',
            path: '/workspace/src/components/NewComponent.tsx'
          }
        }
      ]
      setSteps(mockSteps)
      setCurrentStep('4')
    }
  }, [isAgentRunning])

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepId)) {
        newSet.delete(stepId)
      } else {
        newSet.add(stepId)
      }
      return newSet
    })
  }

  const getStepIcon = (step: ExecutionStep) => {
    switch (step.type) {
      case 'action':
        return CodeBracketIcon
      case 'observation':
        return EyeIcon
      case 'thought':
        return DocumentTextIcon
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

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <PlayIcon className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-white">Execution Timeline</span>
          {isAgentRunning && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-400">Running</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>{steps.length} steps</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {steps.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <PlayIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No execution steps yet</p>
              <p className="text-slate-600 text-xs mt-1">Agent actions will appear here in real-time</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-700"></div>
            
            <div className="space-y-4">
              <AnimatePresence>
                {steps.map((step, index) => {
                  const StepIcon = getStepIcon(step)
                  const StatusIcon = getStatusIcon(step.status)
                  const isExpanded = expandedSteps.has(step.id)
                  const isCurrent = currentStep === step.id
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      {/* Timeline node */}
                      <div className={`absolute left-6 w-4 h-4 rounded-full border-2 ${
                        isCurrent 
                          ? 'border-blue-500 bg-blue-500 shadow-lg shadow-blue-500/50' 
                          : step.status === 'completed'
                          ? 'border-green-500 bg-green-500'
                          : step.status === 'error'
                          ? 'border-red-500 bg-red-500'
                          : 'border-slate-600 bg-slate-700'
                      } flex items-center justify-center`}>
                        {step.status === 'running' && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        )}
                      </div>

                      {/* Step content */}
                      <div className="ml-16">
                        <motion.div
                          className={`bg-slate-800 border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-slate-600 transition-colors ${
                            isCurrent ? 'ring-2 ring-blue-500/50 border-blue-500/50' : ''
                          }`}
                          onClick={() => {
                            toggleStepExpansion(step.id)
                            onStepClick?.(step)
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                step.type === 'action' ? 'bg-blue-600/20' :
                                step.type === 'observation' ? 'bg-green-600/20' :
                                'bg-purple-600/20'
                              }`}>
                                <StepIcon className={`w-4 h-4 ${
                                  step.type === 'action' ? 'text-blue-400' :
                                  step.type === 'observation' ? 'text-green-400' :
                                  'text-purple-400'
                                }`} />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-medium text-white">{step.title}</h3>
                                  <StatusIcon className={`w-4 h-4 ${getStatusColor(step.status)}`} />
                                  {step.duration && (
                                    <span className="text-xs text-slate-500">
                                      {formatDuration(step.duration)}
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-sm text-slate-300 mb-2">
                                  {step.content}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500">
                                    {step.timestamp.toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      second: '2-digit'
                                    })}
                                  </span>
                                  
                                  {step.details && (
                                    <div className="flex items-center space-x-1 text-slate-400">
                                      {isExpanded ? (
                                        <ChevronDownIcon className="w-4 h-4" />
                                      ) : (
                                        <ChevronRightIcon className="w-4 h-4" />
                                      )}
                                      <span className="text-xs">Details</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded details */}
                          <AnimatePresence>
                            {isExpanded && step.details && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-slate-700"
                              >
                                <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                                  {JSON.stringify(step.details, null, 2)}
                                </pre>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentExecutionTimeline
