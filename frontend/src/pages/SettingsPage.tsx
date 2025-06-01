import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Cog6ToothIcon,
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
  CpuChipIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { useAppStore } from '../stores/appStore'
import { toast } from 'react-hot-toast'

const SettingsPage: React.FC = () => {
  const {
    theme,
    setTheme,
    llmProvider,
    llmModel,
    setLLMSettings,
    selectedAgent,
    setSelectedAgent,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'general' | 'llm' | 'agents' | 'security' | 'notifications'>('general')

  const tabs = [
    { id: 'general', label: 'General', icon: Cog6ToothIcon },
    { id: 'llm', label: 'LLM Settings', icon: CpuChipIcon },
    { id: 'agents', label: 'Agents', icon: UserIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
  ]

  const llmProviders = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
    { id: 'google', name: 'Google', models: ['gemini-pro', 'gemini-pro-vision'] },
    { id: 'local', name: 'Local Model', models: ['llama-2', 'mistral', 'codellama'] },
  ]

  const agentTypes = [
    { id: 'codeact', name: 'CodeAct Agent', description: 'Advanced coding and execution agent' },
    { id: 'browsing', name: 'Browsing Agent', description: 'Web browsing and research agent' },
    { id: 'dummy', name: 'Dummy Agent', description: 'Simple testing agent' },
  ]

  const currentProvider = llmProviders.find(p => p.id === llmProvider)

  const handleSaveLLMSettings = (provider: string, model: string) => {
    setLLMSettings(provider, model)
    toast.success('LLM settings saved successfully!')
  }

  const handleSaveAgentSettings = (agent: string) => {
    setSelectedAgent(agent)
    toast.success('Agent settings saved successfully!')
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Configure your OpenReplica experience</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800 border border-slate-700 rounded-xl p-8"
            >
              {activeTab === 'general' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">General Settings</h2>
                  </div>

                  {/* Theme Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setTheme('dark')}
                            className={`
                              flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors
                              ${theme === 'dark'
                                ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                                : 'border-slate-600 text-slate-400 hover:border-slate-500'
                              }
                            `}
                          >
                            <MoonIcon className="w-4 h-4" />
                            <span>Dark</span>
                          </button>
                          <button
                            onClick={() => setTheme('light')}
                            className={`
                              flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors
                              ${theme === 'light'
                                ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                                : 'border-slate-600 text-slate-400 hover:border-slate-500'
                              }
                            `}
                          >
                            <SunIcon className="w-4 h-4" />
                            <span>Light</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Editor Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Editor</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Font Size</label>
                        <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                          <option value="12">12px</option>
                          <option value="14" selected>14px</option>
                          <option value="16">16px</option>
                          <option value="18">18px</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tab Size</label>
                        <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                          <option value="2" selected>2 spaces</option>
                          <option value="4">4 spaces</option>
                          <option value="8">8 spaces</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'llm' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">LLM Settings</h2>
                    <p className="text-slate-400">Configure your language model provider and settings.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Provider</label>
                    <div className="grid grid-cols-2 gap-3">
                      {llmProviders.map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => handleSaveLLMSettings(provider.id, provider.models[0])}
                          className={`
                            p-4 rounded-lg border text-left transition-colors
                            ${llmProvider === provider.id
                              ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                              : 'border-slate-600 text-slate-400 hover:border-slate-500'
                            }
                          `}
                        >
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm opacity-70">{provider.models.length} models available</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentProvider && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
                      <select
                        value={llmModel}
                        onChange={(e) => handleSaveLLMSettings(llmProvider, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      >
                        {currentProvider.models.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Temperature</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        defaultValue="0.7"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Conservative</span>
                        <span>Creative</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Max Tokens</label>
                      <input
                        type="number"
                        defaultValue="4096"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <KeyIcon className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium text-white">API Key Required</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      Configure your API keys in the Security section to use external LLM providers.
                    </p>
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      Configure API Keys →
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Agent Settings</h2>
                    <p className="text-slate-400">Choose your default agent and configure agent behavior.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">Default Agent</label>
                    <div className="space-y-3">
                      {agentTypes.map((agent) => (
                        <label
                          key={agent.id}
                          className="flex items-center space-x-3 p-4 border border-slate-600 rounded-lg cursor-pointer hover:border-slate-500 transition-colors"
                        >
                          <input
                            type="radio"
                            name="defaultAgent"
                            value={agent.id}
                            checked={selectedAgent === agent.id}
                            onChange={() => handleSaveAgentSettings(agent.id)}
                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-white">{agent.name}</div>
                            <div className="text-sm text-slate-400">{agent.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Agent Behavior</h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">Auto-start agent on session creation</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">Show agent thinking process</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">Enable agent memory across sessions</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
                    <p className="text-slate-400">Manage your API keys and security preferences.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">API Keys</h3>
                    <div className="space-y-4">
                      {llmProviders.filter(p => p.id !== 'local').map((provider) => (
                        <div key={provider.id} className="p-4 border border-slate-600 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <label className="font-medium text-white">{provider.name} API Key</label>
                            <span className="text-xs text-green-400">Configured ✓</span>
                          </div>
                          <input
                            type="password"
                            placeholder="sk-..."
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Security Preferences</h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">Encrypt local storage</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">Auto-lock after inactivity</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">Require authentication for sensitive operations</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>
                    <p className="text-slate-400">Configure how and when you receive notifications.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Agent Notifications</h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">Agent task completion</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">Agent errors and failures</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">Agent status changes</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">System Notifications</h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">Connection status changes</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">File save confirmations</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-300">System updates</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
