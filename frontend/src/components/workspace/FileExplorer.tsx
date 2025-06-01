import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

// Mock API for file operations
const fileAPI = {
  list: async (sessionId: string, path: string = '') => {
    // Mock file structure
    await new Promise(resolve => setTimeout(resolve, 200)) // Simulate loading
    
    const mockFiles = [
      { name: 'src', path: 'src', is_directory: true, size: 0, modified: Date.now() - 3600000 },
      { name: 'components', path: 'src/components', is_directory: true, size: 0, modified: Date.now() - 7200000 },
      { name: 'App.tsx', path: 'src/App.tsx', is_directory: false, size: 2048, modified: Date.now() - 1800000 },
      { name: 'main.tsx', path: 'src/main.tsx', is_directory: false, size: 1024, modified: Date.now() - 3600000 },
      { name: 'package.json', path: 'package.json', is_directory: false, size: 1536, modified: Date.now() - 86400000 },
      { name: 'README.md', path: 'README.md', is_directory: false, size: 4096, modified: Date.now() - 172800000 },
      { name: 'tsconfig.json', path: 'tsconfig.json', is_directory: false, size: 512, modified: Date.now() - 86400000 },
      { name: 'vite.config.ts', path: 'vite.config.ts', is_directory: false, size: 768, modified: Date.now() - 86400000 },
      { name: 'backend', path: 'backend', is_directory: true, size: 0, modified: Date.now() - 86400000 },
      { name: 'main.py', path: 'backend/main.py', is_directory: false, size: 3072, modified: Date.now() - 43200000 },
    ]

    if (path === 'src') {
      return {
        files: [
          { name: 'components', path: 'src/components', is_directory: true, size: 0, modified: Date.now() - 7200000 },
          { name: 'pages', path: 'src/pages', is_directory: true, size: 0, modified: Date.now() - 7200000 },
          { name: 'App.tsx', path: 'src/App.tsx', is_directory: false, size: 2048, modified: Date.now() - 1800000 },
          { name: 'main.tsx', path: 'src/main.tsx', is_directory: false, size: 1024, modified: Date.now() - 3600000 },
          { name: 'index.css', path: 'src/index.css', is_directory: false, size: 512, modified: Date.now() - 86400000 },
        ]
      }
    }

    return { files: mockFiles.filter(f => !f.path.includes('/') || f.path.startsWith(path)) }
  },
  
  createFile: async (sessionId: string, path: string) => {
    return { success: true }
  },
  
  createDirectory: async (sessionId: string, path: string) => {
    return { success: true }
  },
  
  delete: async (sessionId: string, path: string) => {
    return { success: true }
  },
  
  rename: async (sessionId: string, oldPath: string, newPath: string) => {
    return { success: true }
  },
}

interface FileExplorerProps {
  sessionId: string
  onFileSelect?: (path: string) => void
  selectedFile?: string | null
  detailed?: boolean
}

interface FileNode {
  name: string
  path: string
  is_directory: boolean
  size: number
  modified: number
  expanded?: boolean
  children?: FileNode[]
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  sessionId, 
  onFileSelect, 
  selectedFile,
  detailed = false 
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']))
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileNode } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState<{ type: 'file' | 'folder'; parentPath?: string } | null>(null)

  const queryClient = useQueryClient()

  const { data: fileList, isLoading } = useQuery({
    queryKey: ['files', sessionId, ''],
    queryFn: () => fileAPI.list(sessionId, ''),
  })

  const createMutation = useMutation({
    mutationFn: ({ type, path }: { type: 'file' | 'folder'; path: string }) =>
      type === 'file' ? fileAPI.createFile(sessionId, path) : fileAPI.createDirectory(sessionId, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', sessionId] })
      toast.success('Created successfully')
      setShowCreateModal(null)
    },
    onError: () => {
      toast.error('Failed to create')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (path: string) => fileAPI.delete(sessionId, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', sessionId] })
      toast.success('Deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete')
    },
  })

  const getFileIcon = (file: FileNode) => {
    if (file.is_directory) {
      return expandedFolders.has(file.path) ? FolderOpenIcon : FolderIcon
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    const iconMap: Record<string, any> = {
      'tsx': CodeBracketIcon,
      'ts': CodeBracketIcon,
      'jsx': CodeBracketIcon,
      'js': CodeBracketIcon,
      'py': CodeBracketIcon,
      'json': DocumentTextIcon,
      'md': DocumentTextIcon,
      'txt': DocumentTextIcon,
    }
    
    return iconMap[ext || ''] || DocumentTextIcon
  }

  const getFileColor = (file: FileNode) => {
    if (file.is_directory) return 'text-blue-400'
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    const colorMap: Record<string, string> = {
      'tsx': 'text-blue-300',
      'ts': 'text-blue-300',
      'jsx': 'text-yellow-300',
      'js': 'text-yellow-300',
      'py': 'text-green-300',
      'json': 'text-orange-300',
      'md': 'text-purple-300',
    }
    
    return colorMap[ext || ''] || 'text-slate-300'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '-'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const handleFileClick = (file: FileNode) => {
    if (file.is_directory) {
      toggleFolder(file.path)
    } else {
      onFileSelect?.(file.path)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, file })
  }

  const renderFileTree = (files: FileNode[], level = 0) => {
    return files.map((file) => {
      const Icon = getFileIcon(file)
      const isSelected = selectedFile === file.path
      const isExpanded = expandedFolders.has(file.path)

      return (
        <motion.div
          key={file.path}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="select-none"
        >
          <div
            className={`
              flex items-center px-2 py-1 rounded cursor-pointer group
              ${isSelected 
                ? 'bg-blue-600/30 text-blue-300' 
                : 'hover:bg-slate-700/50 text-slate-300'
              }
            `}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => handleFileClick(file)}
            onContextMenu={(e) => handleContextMenu(e, file)}
          >
            {file.is_directory && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolder(file.path)
                }}
                className="mr-1 p-0.5 rounded hover:bg-slate-600"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronRightIcon className="w-3 h-3" />
                )}
              </button>
            )}
            
            <Icon className={`w-4 h-4 mr-2 ${getFileColor(file)}`} />
            
            <span className="flex-1 text-sm truncate">{file.name}</span>
            
            {detailed && !file.is_directory && (
              <span className="text-xs text-slate-500 ml-2">
                {formatFileSize(file.size)}
              </span>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleContextMenu(e, file)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-600 ml-1"
            >
              <EllipsisVerticalIcon className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )
    })
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-200">Files</h3>
          <div className="flex space-x-1">
            <button
              onClick={() => setShowCreateModal({ type: 'file' })}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="New File"
            >
              <DocumentTextIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreateModal({ type: 'folder' })}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="New Folder"
            >
              <FolderIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2 px-2 py-1">
                <div className="w-4 h-4 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded flex-1 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : fileList?.files ? (
          <div className="space-y-1">
            {renderFileTree(fileList.files)}
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No files found</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-2 min-w-[160px]"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
            >
              <button
                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center space-x-2"
                onClick={() => {
                  // Open file logic
                  setContextMenu(null)
                }}
              >
                <DocumentTextIcon className="w-4 h-4" />
                <span>Open</span>
              </button>
              
              <button
                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center space-x-2"
                onClick={() => {
                  // Rename logic
                  setContextMenu(null)
                }}
              >
                <PencilIcon className="w-4 h-4" />
                <span>Rename</span>
              </button>
              
              <button
                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center space-x-2"
                onClick={() => {
                  // Duplicate logic
                  setContextMenu(null)
                }}
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
                <span>Duplicate</span>
              </button>
              
              <button
                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center space-x-2"
                onClick={() => {
                  // Download logic
                  setContextMenu(null)
                }}
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download</span>
              </button>
              
              <hr className="my-2 border-slate-600" />
              
              <button
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center space-x-2"
                onClick={() => {
                  deleteMutation.mutate(contextMenu.file.path)
                  setContextMenu(null)
                }}
              >
                <TrashIcon className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <CreateModal
        isOpen={!!showCreateModal}
        type={showCreateModal?.type || 'file'}
        onClose={() => setShowCreateModal(null)}
        onSubmit={(name) => {
          const parentPath = showCreateModal?.parentPath || ''
          const fullPath = parentPath ? `${parentPath}/${name}` : name
          createMutation.mutate({ type: showCreateModal!.type, path: fullPath })
        }}
        isLoading={createMutation.isPending}
      />
    </div>
  )
}

// Create Modal Component
const CreateModal: React.FC<{
  isOpen: boolean
  type: 'file' | 'folder'
  onClose: () => void
  onSubmit: (name: string) => void
  isLoading: boolean
}> = ({ isOpen, type, onClose, onSubmit, isLoading }) => {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
      setName('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Create New {type === 'file' ? 'File' : 'Folder'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`${type === 'file' ? 'filename.ext' : 'folder-name'}`}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            autoFocus
          />

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default FileExplorer
