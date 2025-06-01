import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  PlayIcon,
  CpuChipIcon,
  CommandLineIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  SparklesIcon,
  BoltIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'
import { useAppStore } from '../stores/appStore'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { setCurrentSessionId, selectedAgent, llmProvider, llmModel } = useAppStore()

  const features = [
    {
      icon: CpuChipIcon,
      title: 'Custom Microagents',
      description: 'Create, manage, and deploy your own specialized AI microagents',
      color: 'from-blue-500 to-cyan-500',
      href: '/microagents',
    },
    {
      icon: CommandLineIcon,
      title: 'AI Workspace',
      description: 'Intelligent code editing with real-time AI assistance',
      color: 'from-purple-500 to-pink-500',
      href: '/workspace',
    },
    {
      icon: UserGroupIcon,
      title: 'Agent Management',
      description: 'Control multiple AI agents for different development tasks',
      color: 'from-green-500 to-emerald-500',
      href: '/agents',
    },
    {
      icon: DocumentTextIcon,
      title: 'Smart Documentation',
      description: 'Generate and maintain documentation automatically',
      color: 'from-orange-500 to-red-500',
      href: '/files',
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics Dashboard',
      description: 'Track performance and usage across all your projects',
      color: 'from-indigo-500 to-purple-500',
      href: '/analytics',
    },
    {
      icon: BoltIcon,
      title: 'Real-time Collaboration',
      description: 'Work together with AI agents in shared workspaces',
      color: 'from-yellow-500 to-orange-500',
      href: '/chat',
    },
  ]

  const stats = [
    { label: 'Active Agents', value: '3', change: '+12%' },
    { label: 'Sessions Today', value: '24', change: '+8%' },
    { label: 'Code Generated', value: '15.2k', change: '+23%' },
    { label: 'Tasks Completed', value: '89', change: '+15%' },
  ]

  const quickActions = [
    {
      title: 'New Workspace',
      description: 'Start a fresh AI-powered development session',
      icon: PlayIcon,
      action: () => {
        // Create new session and navigate to workspace
        const sessionId = `session_${Date.now()}`
        setCurrentSessionId(sessionId)
        navigate(`/workspace/${sessionId}`)
      },
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Create Microagent',
      description: 'Build a custom AI agent for specific tasks',
      icon: CpuChipIcon,
      action: () => navigate('/microagents/create'),
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Browse Templates',
      description: 'Explore pre-built microagent templates',
      icon: DocumentTextIcon,
      action: () => navigate('/microagents'),
      color: 'bg-green-600 hover:bg-green-700',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex items-center justify-center mb-6"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-bold text-white">OpenReplica</h1>
                <p className="text-xl text-blue-400">Enhanced OpenReplica Platform</p>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-slate-300 max-w-3xl mx-auto mb-12"
            >
              Code Less, Make More. The ultimate AI development platform with custom microagents,
              intelligent workspaces, and real-time collaboration.
            </motion.p>

            {/* Current Session Info */}
            {llmProvider && llmModel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="flex items-center justify-center space-x-4 mb-12"
              >
                <div className="px-4 py-2 bg-slate-700/50 rounded-full">
                  <span className="text-sm text-slate-300">LLM: {llmProvider}/{llmModel}</span>
                </div>
                {selectedAgent && (
                  <div className="px-4 py-2 bg-slate-700/50 rounded-full">
                    <span className="text-sm text-slate-300">Agent: {selectedAgent}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16"
            >
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <motion.button
                    key={action.title}
                    onClick={action.action}
                    className={`${action.color} p-6 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-8 h-8 text-white mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                    <p className="text-sm text-white/80">{action.description}</p>
                  </motion.button>
                )
              })}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="max-w-7xl mx-auto px-6 py-16"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1, duration: 0.8 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center"
            >
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
              <span className="text-green-400 text-xs font-medium">{stat.change}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="max-w-7xl mx-auto px-6 py-16"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Explore the comprehensive suite of tools designed to enhance your development workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + index * 0.1, duration: 0.8 }}
                onClick={() => navigate(feature.href)}
                className="group cursor-pointer bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4">{feature.description}</p>
                <div className="flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more
                  <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="max-w-4xl mx-auto px-6 py-24 text-center"
      >
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-12">
          <CodeBracketIcon className="w-16 h-16 text-blue-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of developers using OpenReplica to accelerate their development workflow
            with AI-powered tools and custom microagents.
          </p>
          <motion.button
            onClick={() => {
              const sessionId = `session_${Date.now()}`
              setCurrentSessionId(sessionId)
              navigate(`/workspace/${sessionId}`)
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Launch Workspace
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default HomePage
