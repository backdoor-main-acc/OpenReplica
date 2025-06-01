import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import {
  CommandLineIcon,
  XMarkIcon,
  PlusIcon,
  Cog6ToothIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline'

interface TerminalProps {
  sessionId: string
}

interface TerminalSession {
  id: string
  title: string
  terminal: XTerm
  fitAddon: FitAddon
  active: boolean
  running: boolean
}

const Terminal: React.FC<TerminalProps> = ({ sessionId }) => {
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Create initial terminal session
  useEffect(() => {
    createNewSession()
  }, [])

  const createNewSession = () => {
    const sessionId = Date.now().toString()
    const terminal = new XTerm({
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#3b82f6',
        selection: '#374151',
        black: '#1e293b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f1f5f9',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, Monaco, monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      allowTransparency: true,
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    const newSession: TerminalSession = {
      id: sessionId,
      title: `Terminal ${sessions.length + 1}`,
      terminal,
      fitAddon,
      active: true,
      running: true,
    }

    setSessions(prev => [
      ...prev.map(s => ({ ...s, active: false })),
      newSession
    ])
    setActiveSessionId(sessionId)

    // Initialize terminal with welcome message
    setTimeout(() => {
      terminal.writeln('\x1b[1;34mWelcome to OpenReplica Terminal\x1b[0m')
      terminal.writeln('\x1b[32mEnhanced OpenReplica Development Environment\x1b[0m')
      terminal.writeln('')
      terminal.write('\x1b[36mopenreplica@workspace\x1b[0m:\x1b[34m~/project\x1b[0m$ ')
      
      // Handle user input
      let currentLine = ''
      terminal.onData((data) => {
        if (data === '\r') { // Enter key
          terminal.writeln('')
          handleCommand(currentLine, terminal)
          currentLine = ''
          terminal.write('\x1b[36mopenreplica@workspace\x1b[0m:\x1b[34m~/project\x1b[0m$ ')
        } else if (data === '\u007f') { // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1)
            terminal.write('\b \b')
          }
        } else if (data >= ' ') { // Printable characters
          currentLine += data
          terminal.write(data)
        }
      })
    }, 100)
  }

  const handleCommand = (command: string, terminal: XTerm) => {
    const cmd = command.trim().toLowerCase()
    
    switch (cmd) {
      case 'help':
        terminal.writeln('Available commands:')
        terminal.writeln('  help     - Show this help message')
        terminal.writeln('  clear    - Clear the terminal')
        terminal.writeln('  ls       - List directory contents')
        terminal.writeln('  pwd      - Show current directory')
        terminal.writeln('  whoami   - Show current user')
        terminal.writeln('  date     - Show current date and time')
        terminal.writeln('  echo     - Echo text')
        terminal.writeln('  python   - Start Python interpreter')
        terminal.writeln('  node     - Start Node.js REPL')
        break
      
      case 'clear':
        terminal.clear()
        break
      
      case 'ls':
        terminal.writeln('src/          package.json  README.md     main.py')
        terminal.writeln('components/   tsconfig.json vite.config.ts')
        break
      
      case 'pwd':
        terminal.writeln('/home/openreplica/project')
        break
      
      case 'whoami':
        terminal.writeln('openreplica')
        break
      
      case 'date':
        terminal.writeln(new Date().toString())
        break
      
      case 'python':
        terminal.writeln('Python 3.11.0 (OpenReplica AI Environment)')
        terminal.writeln('Type "exit()" to return to shell.')
        terminal.writeln('>>> ')
        break
      
      case 'node':
        terminal.writeln('Welcome to Node.js v20.0.0.')
        terminal.writeln('Type ".exit" to return to shell.')
        terminal.writeln('> ')
        break
      
      case '':
        // Empty command, do nothing
        break
      
      default:
        if (cmd.startsWith('echo ')) {
          terminal.writeln(command.slice(5))
        } else {
          terminal.writeln(`bash: ${cmd}: command not found`)
        }
        break
    }
  }

  // Mount terminal to DOM when active session changes
  useEffect(() => {
    const activeSession = sessions.find(s => s.id === activeSessionId)
    if (!activeSession) return

    const terminalElement = terminalRefs.current.get(activeSessionId)
    if (!terminalElement) return

    // Clear the element first
    terminalElement.innerHTML = ''
    
    // Open terminal in the element
    activeSession.terminal.open(terminalElement)
    
    // Fit the terminal
    setTimeout(() => {
      activeSession.fitAddon.fit()
    }, 100)

    // Handle window resize
    const handleResize = () => {
      activeSession.fitAddon.fit()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeSessionId, sessions])

  const closeSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      session.terminal.dispose()
    }

    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId)
      if (sessionId === activeSessionId && newSessions.length > 0) {
        const newActive = newSessions[newSessions.length - 1]
        newActive.active = true
        setActiveSessionId(newActive.id)
      } else if (newSessions.length === 0) {
        setActiveSessionId(null)
      }
      return newSessions
    })
  }

  const switchSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => ({ 
      ...s, 
      active: s.id === sessionId 
    })))
    setActiveSessionId(sessionId)
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Tab Bar */}
      <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center overflow-x-auto">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              className={`
                flex items-center space-x-2 px-3 py-2 border-r border-slate-700 cursor-pointer min-w-0 group
                ${session.active 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }
              `}
              onClick={() => switchSession(session.id)}
              layout
            >
              <CommandLineIcon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{session.title}</span>
              {session.running && (
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeSession(session.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600 rounded transition-all"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center space-x-2 px-3">
          <button
            onClick={createNewSession}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="New Terminal"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="Terminal Settings"
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative">
        {sessions.map((session) => (
          <div
            key={session.id}
            ref={(el) => {
              if (el) terminalRefs.current.set(session.id, el)
            }}
            className={`absolute inset-0 ${session.active ? 'block' : 'hidden'}`}
            style={{ padding: '8px' }}
          />
        ))}
        
        {sessions.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <CommandLineIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-400 mb-2">No terminal sessions</h3>
              <p className="text-slate-500 mb-6">Create a new terminal to get started</p>
              <button
                onClick={createNewSession}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Terminal</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {activeSessionId && (
        <div className="h-6 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-4 text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Shell: bash</span>
            <span className="text-slate-400">PID: {Math.floor(Math.random() * 10000)}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Session: {activeSessionId.slice(0, 8)}</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400">Running</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Terminal
