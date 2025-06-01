import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Editor from '@monaco-editor/react'
import { 
  DocumentIcon,
  XMarkIcon,
  FolderPlusIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

// Mock API for file operations
const fileAPI = {
  read: async (sessionId: string, path: string) => {
    // Mock file content
    return {
      content: `// Welcome to OpenReplica Code Editor
// This is a sample file for ${path}

function example() {
  console.log("Hello from OpenReplica!");
  
  // Your code here
  return "Enhanced OpenReplica Platform";
}

export default example;`,
      encoding: 'utf-8',
    }
  },
  write: async (sessionId: string, path: string, content: string) => {
    return { success: true }
  },
  list: async (sessionId: string, path: string = '') => {
    // Mock file structure
    return {
      files: [
        { name: 'src', path: 'src', is_directory: true, size: 0, modified: Date.now() },
        { name: 'package.json', path: 'package.json', is_directory: false, size: 1024, modified: Date.now() },
        { name: 'README.md', path: 'README.md', is_directory: false, size: 2048, modified: Date.now() },
        { name: 'main.py', path: 'main.py', is_directory: false, size: 1536, modified: Date.now() },
      ]
    }
  }
}

interface CodeEditorProps {
  sessionId: string
  filePath: string | null
  onFileChange?: (path: string | null) => void
}

interface Tab {
  id: string
  path: string
  name: string
  content: string
  modified: boolean
  active: boolean
}

const CodeEditor: React.FC<CodeEditorProps> = ({ sessionId, filePath, onFileChange }) => {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const queryClient = useQueryClient()

  // Load file content when filePath changes
  const { data: fileContent, isLoading } = useQuery({
    queryKey: ['file-content', sessionId, filePath],
    queryFn: () => filePath ? fileAPI.read(sessionId, filePath) : null,
    enabled: !!filePath,
  })

  const saveMutation = useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      fileAPI.write(sessionId, path, content),
    onSuccess: () => {
      toast.success('File saved successfully')
    },
    onError: () => {
      toast.error('Failed to save file')
    },
  })

  // Open file in new tab
  useEffect(() => {
    if (filePath && fileContent) {
      const existingTab = tabs.find(tab => tab.path === filePath)
      
      if (!existingTab) {
        const newTab: Tab = {
          id: Date.now().toString(),
          path: filePath,
          name: filePath.split('/').pop() || filePath,
          content: fileContent.content,
          modified: false,
          active: true,
        }
        
        setTabs(prev => [...prev.map(t => ({ ...t, active: false })), newTab])
        setActiveTabId(newTab.id)
      } else {
        setTabs(prev => prev.map(tab => ({ 
          ...tab, 
          active: tab.id === existingTab.id,
          content: tab.id === existingTab.id ? fileContent.content : tab.content
        })))
        setActiveTabId(existingTab.id)
      }
    }
  }, [filePath, fileContent])

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  const handleEditorChange = (value: string | undefined) => {
    if (!activeTab || !value) return

    setTabs(prev => prev.map(tab => 
      tab.id === activeTab.id 
        ? { ...tab, content: value, modified: true }
        : tab
    ))
  }

  const handleSaveFile = () => {
    if (!activeTab) return
    
    saveMutation.mutate({
      path: activeTab.path,
      content: activeTab.content,
    })

    setTabs(prev => prev.map(tab => 
      tab.id === activeTab.id 
        ? { ...tab, modified: false }
        : tab
    ))
  }

  const handleCloseTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab?.modified) {
      if (!confirm(`Save changes to ${tab.name}?`)) {
        return
      }
      handleSaveFile()
    }

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId)
      if (tabId === activeTabId && newTabs.length > 0) {
        const newActiveTab = newTabs[newTabs.length - 1]
        newActiveTab.active = true
        setActiveTabId(newActiveTab.id)
        onFileChange?.(newActiveTab.path)
      } else if (newTabs.length === 0) {
        setActiveTabId(null)
        onFileChange?.(null)
      }
      return newTabs
    })
  }

  const handleTabClick = (tabId: string) => {
    setTabs(prev => prev.map(tab => ({ 
      ...tab, 
      active: tab.id === tabId 
    })))
    setActiveTabId(tabId)
    
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      onFileChange?.(tab.path)
    }
  }

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'json': 'json',
      'md': 'markdown',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
    }
    return languageMap[ext || ''] || 'plaintext'
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSaveFile()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault()
      setShowSearch(!showSearch)
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Tab Bar */}
      {tabs.length > 0 && (
        <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => (
              <motion.div
                key={tab.id}
                className={`
                  flex items-center space-x-2 px-4 py-2 border-r border-slate-700 cursor-pointer min-w-0 group
                  ${tab.active 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }
                `}
                onClick={() => handleTabClick(tab.id)}
                layout
              >
                <DocumentIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm">{tab.name}</span>
                {tab.modified && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCloseTab(tab.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600 rounded transition-all"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800 border-b border-slate-700 p-3"
        >
          <div className="flex items-center space-x-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search in file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={() => setShowSearch(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <Editor
            height="100%"
            language={getLanguageFromPath(activeTab.path)}
            value={activeTab.content}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Fira Code, Monaco, monospace',
              lineNumbers: 'on',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: true,
              renderWhitespace: 'selection',
              renderControlCharacters: true,
              bracketPairColorization: { enabled: true },
              guides: {
                indentation: true,
                bracketPairs: true,
              },
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              parameterHints: { enabled: true },
              formatOnType: true,
              formatOnPaste: true,
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="text-slate-400">Loading editor...</div>
              </div>
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <DocumentIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-400 mb-2">No file open</h3>
              <p className="text-slate-500 mb-6">Select a file from the explorer to start editing</p>
              <div className="flex space-x-3 justify-center">
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <DocumentPlusIcon className="w-4 h-4" />
                  <span>New File</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
                  <FolderPlusIcon className="w-4 h-4" />
                  <span>New Folder</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {activeTab && (
        <div className="h-6 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-4 text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">{getLanguageFromPath(activeTab.path)}</span>
            <span className="text-slate-400">UTF-8</span>
            <span className="text-slate-400">LF</span>
            {activeTab.modified && (
              <span className="text-blue-400">● Modified</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Ln 1, Col 1</span>
            <span className="text-slate-400">Spaces: 2</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeEditor
