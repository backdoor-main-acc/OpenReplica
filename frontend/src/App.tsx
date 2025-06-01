import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import WorkspacePage from './pages/WorkspacePage'
import MicroagentsPage from './pages/MicroagentsPage'
import SettingsPage from './pages/SettingsPage'
import { useAppStore } from './stores/appStore'

function App() {
  const { theme } = useAppStore()

  return (
    <div className={`app ${theme}`}>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workspace/:sessionId?" element={
            <MainLayout>
              <WorkspacePage />
            </MainLayout>
          } />
          <Route path="/microagents/*" element={
            <MainLayout>
              <MicroagentsPage />
            </MainLayout>
          } />
          <Route path="/agents" element={
            <MainLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-4">Agents</h1>
                <p className="text-slate-400">Agent management coming soon...</p>
              </div>
            </MainLayout>
          } />
          <Route path="/files" element={
            <MainLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-4">Files</h1>
                <p className="text-slate-400">File management coming soon...</p>
              </div>
            </MainLayout>
          } />
          <Route path="/chat" element={
            <MainLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-4">Chat</h1>
                <p className="text-slate-400">Standalone chat coming soon...</p>
              </div>
            </MainLayout>
          } />
          <Route path="/analytics" element={
            <MainLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-4">Analytics</h1>
                <p className="text-slate-400">Analytics dashboard coming soon...</p>
              </div>
            </MainLayout>
          } />
          <Route path="/settings" element={
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          } />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
