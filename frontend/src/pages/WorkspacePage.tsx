import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import {
  CodeBracketIcon,
  CommandLineIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  FolderIcon,
  PlayIcon,
  StopIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { useSession, useAppStore } from '../stores/appStore'
import { useWebSocket } from '../services/websocket'
import CodeEditor from '../components/workspace/CodeEditor'
import Terminal from '../components/workspace/Terminal'
import FileExplorer from '../components/workspace/FileExplorer'
import ChatPanel from '../components/workspace/ChatPanel'
import AgentStatus from '../components/workspace/AgentStatus'

const WorkspacePage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { currentSessionId, setCurrentSessionId } = useSession()
  const { selectedAgent, connected } = useAppStore()
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal' | 'chat' | 'files'>('editor')
  const [agentRunning, setAgentRunning] = useState(false)
  const [currentFile, setCurrentFile] = useState<string | null>(null)

  // Initialize session
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId)
    }
  }, [sessionId, currentSessionId, setCurrentSessionId])

  // WebSocket connection
  const {
    connectionStatus,
    isConnected,
    sendUserMessage,
    startAgent,
    stopAgent,
    on,
  } = useWebSocket(currentSessionId)

  // Listen for agent events
  useEffect(() => {
    if (!isConnected) return

    const unsubscribeAgentStart = on('agent_started', () => {
      setAgentRunning(true)
    })

    const unsubscribeAgentStop = on('agent_stopped', () => {
      setAgentRunning(false)
    })

    const unsubscribeMessage = on('message', (data) => {
      console.log('Received message:', data)
    })

    return () => {
      unsubscribeAgentStart()
      unsubscribeAgentStop()
      unsubscribeMessage()
    }
  }, [isConnected, on])

  const handleStartAgent = () => {
    if (selectedAgent && isConnected) {
      startAgent(selectedAgent)
    }
  }

  const handleStopAgent = () => {
    if (isConnected) {
      stopAgent()
    }
  }

  const handleSendMessage = (message: string) => {
    if (isConnected) {
      sendUserMessage(message)
    }
  }

  const tabs = [
    { id: 'editor', label: 'Editor', icon: CodeBracketIcon },
    { id: 'terminal', label: 'Terminal', icon: CommandLineIcon },
    { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'files', label: 'Files', icon: FolderIcon },
  ]

  if (!currentSessionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Active Session</h2>
          <p className="text-slate-400">Please start a new session from the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Workspace Header */}
      <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-slate-300">
              Session: {currentSessionId.slice(0, 8)}...
            </span>
          </div>
          {currentFile && (
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <DocumentTextIcon className="w-4 h-4" />
              <span>{currentFile}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Agent Controls */}
          <div className="flex items-center space-x-2">
            {agentRunning ? (
              <motion.button
                onClick={handleStopAgent}
                className="flex items-center space-x-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <StopIcon className="w-4 h-4" />
                <span>Stop Agent</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={handleStartAgent}
                disabled={!selectedAgent || !isConnected}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md text-sm transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlayIcon className="w-4 h-4" />
                <span>Start Agent</span>
              </motion.button>
            )}
          </div>

          {/* Agent Status */}
          <AgentStatus 
            isRunning={agentRunning}
            agentType={selectedAgent}
            connected={isConnected}
          />
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - File Explorer (collapsible) */}
        <motion.div
          className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col"
          initial={{ width: 320 }}
          animate={{ width: 320 }}
        >
          <div className="h-10 bg-slate-700 border-b border-slate-600 flex items-center px-4">
            <FolderIcon className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-sm font-medium text-slate-300">Explorer</span>
          </div>
          <div className="flex-1 overflow-auto">
            <FileExplorer 
              sessionId={currentSessionId}
              onFileSelect={setCurrentFile}
              selectedFile={currentFile}
            />
          </div>
        </motion.div>

        {/* Center Panel - Tabbed Interface */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center px-4">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' && (
              <CodeEditor 
                sessionId={currentSessionId}
                filePath={currentFile}
                onFileChange={setCurrentFile}
              />
            )}
            {activeTab === 'terminal' && (
              <Terminal 
                sessionId={currentSessionId}
              />
            )}
            {activeTab === 'chat' && (
              <ChatPanel 
                sessionId={currentSessionId}
                onSendMessage={handleSendMessage}
                connected={isConnected}
              />
            )}
            {activeTab === 'files' && (
              <div className="p-4">
                <FileExplorer 
                  sessionId={currentSessionId}
                  onFileSelect={setCurrentFile}
                  selectedFile={currentFile}
                  detailed={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-4 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-slate-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {currentFile && (
            <span className="text-slate-400">{currentFile}</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-400">Session: {currentSessionId.slice(0, 8)}</span>
          <span className="text-slate-400">OpenReplica v1.0.0</span>
        </div>
      </div>
    </div>
  )
}

export default WorkspacePage
