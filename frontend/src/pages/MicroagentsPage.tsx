import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusIcon,
  CpuChipIcon,
  PlayIcon,
  StopIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  KeyIcon,
  TagIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

import { microagentsAPI, CreateMicroagentRequest, MicroagentResponse } from '../services/api'

const MicroagentsPage: React.FC = () => {
  const [selectedMicroagent, setSelectedMicroagent] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'knowledge' | 'repo'>('all')

  const queryClient = useQueryClient()

  const { data: microagents = [], isLoading } = useQuery({
    queryKey: ['microagents', filterType],
    queryFn: () => microagentsAPI.getAll(filterType === 'all' ? undefined : filterType),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateMicroagentRequest) => microagentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microagents'] })
      setShowCreateModal(false)
      toast.success('Microagent created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create microagent')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (name: string) => microagentsAPI.delete(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microagents'] })
      toast.success('Microagent deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete microagent')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (name: string) => microagentsAPI.toggle(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microagents'] })
      toast.success('Microagent status updated!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update microagent status')
    },
  })

  const filteredMicroagents = microagents.filter((microagent: MicroagentResponse) => {
    const description = microagent.metadata?.description || ''
    const matchesSearch = microagent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || microagent.type === filterType
    return matchesSearch && matchesType
  })

  const getStatusColor = (microagent: MicroagentResponse) => {
    return microagent.is_custom ? 'text-blue-400' : 'text-green-400'
  }

  const getTypeIcon = (type: string) => {
    return type === 'knowledge' ? KeyIcon : DocumentTextIcon
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Microagents</h1>
            <p className="text-slate-400">Create and manage your custom AI microagents</p>
          </div>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Microagent</span>
          </motion.button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search microagents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            {['all', 'knowledge', 'repo'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Microagents Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-slate-700 rounded mb-4"></div>
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredMicroagents.map((microagent: any) => {
                const TypeIcon = getTypeIcon(microagent.type)
                return (
                  <motion.div
                    key={microagent.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-300 cursor-pointer group"
                    onClick={() => setSelectedMicroagent(microagent)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <CpuChipIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {microagent.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-xs">
                            <TypeIcon className="w-3 h-3" />
                            <span className="text-slate-400">{microagent.type}</span>
                            <div className={`w-2 h-2 rounded-full ${microagent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                            <span className={getStatusColor(microagent.status)}>{microagent.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleMutation.mutate(microagent.id)
                          }}
                          className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          {microagent.status === 'active' ? (
                            <StopIcon className="w-4 h-4" />
                          ) : (
                            <PlayIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Edit functionality
                          }}
                          className="p-1 text-slate-400 hover:text-yellow-400 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMutation.mutate(microagent.id)
                          }}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {microagent.description}
                    </p>

                    {/* Triggers */}
                    {microagent.triggers && microagent.triggers.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {microagent.triggers.slice(0, 3).map((trigger: string) => (
                            <span
                              key={trigger}
                              className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full"
                            >
                              {trigger}
                            </span>
                          ))}
                          {microagent.triggers.length > 3 && (
                            <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded-full">
                              +{microagent.triggers.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>Used {microagent.usage_count} times</span>
                      </div>
                      <span>{new Date(microagent.created_at).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredMicroagents.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <CpuChipIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-400 mb-2">No microagents found</h3>
            <p className="text-slate-500 mb-6">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first microagent to get started'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Microagent
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateMicroagentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* Detail Modal */}
      <MicroagentDetailModal
        microagent={selectedMicroagent}
        onClose={() => setSelectedMicroagent(null)}
      />
    </div>
  )
}

// Create Microagent Modal Component
const CreateMicroagentModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'knowledge',
    description: '',
    triggers: '',
    content: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      triggers: formData.triggers.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Microagent</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="knowledge">Knowledge</option>
              <option value="repo">Repository</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Trigger Words (comma separated)
            </label>
            <input
              type="text"
              value={formData.triggers}
              onChange={(e) => setFormData({ ...formData, triggers: e.target.value })}
              placeholder="review, check, analyze"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              placeholder="Enter your microagent instructions and behavior..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Microagent'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// Detail Modal Component
const MicroagentDetailModal: React.FC<{
  microagent: any
  onClose: () => void
}> = ({ microagent, onClose }) => {
  if (!microagent) return null

  const TypeIcon = getTypeIcon(microagent.type)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CpuChipIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{microagent.name}</h2>
              <div className="flex items-center space-x-2 text-sm">
                <TypeIcon className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">{microagent.type}</span>
                <div className={`w-2 h-2 rounded-full ${microagent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className={microagent.status === 'active' ? 'text-green-400' : 'text-gray-400'}>
                  {microagent.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-slate-300">{microagent.description}</p>
          </div>

          {microagent.triggers && microagent.triggers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Trigger Words</h3>
              <div className="flex flex-wrap gap-2">
                {microagent.triggers.map((trigger: string) => (
                  <span
                    key={trigger}
                    className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full"
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Usage Count</p>
                <p className="text-2xl font-bold text-white">{microagent.usage_count}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">Last Used</p>
                <p className="text-white">{new Date(microagent.last_used).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Created</h3>
            <p className="text-slate-300">{new Date(microagent.created_at).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const getTypeIcon = (type: string) => {
  return type === 'knowledge' ? KeyIcon : DocumentTextIcon
}

export default MicroagentsPage
