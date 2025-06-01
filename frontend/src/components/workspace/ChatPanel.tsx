import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PaperAirplaneIcon,
  UserIcon,
  CpuChipIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface ChatPanelProps {
  sessionId: string
  onSendMessage: (message: string) => void
  connected: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
  thinking?: boolean
}

const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, onSendMessage, connected }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'system',
        content: 'Welcome to OpenReplica! I\'m your AI assistant. I can help you with coding, debugging, documentation, and more. How can I assist you today?',
        timestamp: new Date(),
        status: 'sent',
      }
    ])
  }, [sessionId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle WebSocket messages (would be connected to actual WebSocket in real implementation)
  useEffect(() => {
    // Mock receiving assistant responses
    const handleMockResponse = (userMessage: string) => {
      setIsTyping(true)
      
      setTimeout(() => {
        const responses = [
          "I understand you want to work on that. Let me help you break it down step by step.",
          "Great question! Here's what I suggest:\n\n```python\ndef example_function():\n    # Your code here\n    return \"Hello from OpenReplica!\"\n```\n\nThis should get you started.",
          "I can help you with that. Let me analyze the code and provide some suggestions.",
          "That's an interesting approach. Here are some considerations:\n\n1. **Performance**: This could be optimized\n2. **Security**: Make sure to validate inputs\n3. **Maintainability**: Consider breaking into smaller functions",
        ]
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: randomResponse,
            timestamp: new Date(),
            status: 'sent',
          }
        ])
        setIsTyping(false)
      }, 1000 + Math.random() * 2000)
    }

    // Mock delay for sending messages
    if (messages.length > 1) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'user' && lastMessage.status === 'sending') {
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === lastMessage.id 
              ? { ...msg, status: 'sent' as const }
              : msg
          ))
          handleMockResponse(lastMessage.content)
        }, 500)
      }
    }
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim() || !connected) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      status: 'sending',
    }

    setMessages(prev => [...prev, newMessage])
    onSendMessage(inputValue.trim())
    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getMessageIcon = (role: string, status?: string) => {
    if (role === 'user') {
      return <UserIcon className="w-6 h-6" />
    } else if (role === 'system') {
      return <ExclamationCircleIcon className="w-6 h-6" />
    } else {
      return <CpuChipIcon className="w-6 h-6" />
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <ArrowPathIcon className="w-3 h-3 animate-spin" />
      case 'sent':
        return <CheckCircleIcon className="w-3 h-3" />
      case 'error':
        return <ExclamationCircleIcon className="w-3 h-3" />
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <CpuChipIcon className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-white">AI Assistant</span>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <ClockIcon className="w-4 h-4" />
          <span>Session: {sessionId.slice(0, 8)}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`flex space-x-3 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {/* Avatar */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.role === 'system'
                    ? 'bg-orange-600 text-white'
                    : 'bg-purple-600 text-white'
                  }
                `}>
                  {getMessageIcon(message.role)}
                </div>

                {/* Message Content */}
                <div className={`
                  rounded-2xl px-4 py-3 relative
                  ${message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-100 border border-slate-700'
                  }
                `}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg !mt-2 !mb-2"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code 
                              className="bg-slate-700 px-1.5 py-0.5 rounded text-sm" 
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {/* Timestamp and Status */}
                  <div className={`
                    flex items-center justify-between mt-2 pt-2 border-t text-xs opacity-60
                    ${message.role === 'user' 
                      ? 'border-blue-500' 
                      : 'border-slate-600'
                    }
                  `}>
                    <span>{formatTime(message.timestamp)}</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex space-x-3"
            >
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={connected ? "Type your message..." : "Connect to start chatting"}
              disabled={!connected}
              className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[48px] max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '48px',
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !connected}
              className="absolute right-2 top-2 p-2 text-blue-400 hover:text-blue-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Connection Status */}
        {!connected && (
          <div className="mt-2 text-center">
            <span className="text-xs text-red-400">Disconnected - Reconnecting...</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Help me debug this code",
            "Explain this function",
            "Write tests for this",
            "Optimize performance",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ChatPanel
