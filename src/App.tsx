import { Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import './App.css'
import './components/sidebar.css'
import { WorkflowProvider, useWorkflow } from './context/WorkflowContext'
import { useAgnesAPI } from './hooks/useAgnesAPI'
import { secureStorage } from './utils/secureStorage'
import Sidebar from './components/Sidebar'
import LoadingScreen from './components/LoadingScreen'
import Home from './pages/Home'
import Outline from './pages/Outline'
import DetailOutline from './pages/DetailOutline'
import KnowledgeOutput from './pages/KnowledgeOutput'
import Settings from './pages/Settings'
import Danmaku from './components/Danmaku'

// 全局加载状态管理
export const GlobalLoadingContext = {
  isLoading: false,
  setGlobalLoading: (_loading: boolean) => {}
}

function AppContent() {
  const navigate = useNavigate()
  const { workflow, initialized, setIsRunning, setCurrentStep } = useWorkflow()
  const { validateApiKey, apiError, clearError } = useAgnesAPI()

  const [showApiError, setShowApiError] = useState(false)
  const [danmakuContent, setDanmakuContent] = useState('')
  const [isNewDanmaku, setIsNewDanmaku] = useState(false)
  const [globalLoading, setGlobalLoading] = useState(false)
  const lastDetailKey = useRef('')
  const lastOutputKey = useRef('')

  // 导出全局加载状态
  GlobalLoadingContext.isLoading = globalLoading
  GlobalLoadingContext.setGlobalLoading = setGlobalLoading

  useEffect(() => {
    if (initialized) {
      // 重置运行状态，避免自动继续
      setIsRunning(false)
      setCurrentStep(null)
      
      // 同步加载加密配置
      secureStorage.loadConfig()
      
      // 后台静默验证API Key
      validateApiKey().then(valid => {
        if (!valid) {
          setShowApiError(true)
        }
      })
    }
  }, [initialized, validateApiKey, setIsRunning, setCurrentStep])

  useEffect(() => {
    if (apiError && apiError.type === 'api') {
      setGlobalLoading(false)
      setIsRunning(false)
      setCurrentStep(null)
      setShowApiError(true)
    }
  }, [apiError, setGlobalLoading, setIsRunning, setCurrentStep])

  const handleGoToSettings = () => {
    setShowApiError(false)
    clearError()
    navigate('/settings')
  }

  useEffect(() => {
    const detailSections = workflow.detailSections || {}
    const outputSections = workflow.outputSections || {}
    const currentDetailKeys = Object.keys(detailSections)
    const currentOutputKeys = Object.keys(outputSections)
    
    // 检测细纲完成
    for (const key of currentDetailKeys) {
      const content = detailSections[key]
      if (content && content.length > 0 && key !== lastDetailKey.current) {
        lastDetailKey.current = key
        setDanmakuContent(`[细纲] ${key}: ${content}`)
        setIsNewDanmaku(true)
        setTimeout(() => setIsNewDanmaku(false), 100)
        break
      }
    }

    // 检测正文完成
    for (const key of currentOutputKeys) {
      const content = outputSections[key]
      if (content && content.length > 0 && key !== lastOutputKey.current) {
        lastOutputKey.current = key
        setDanmakuContent(`[正文] ${key}: ${content}`)
        setIsNewDanmaku(true)
        setTimeout(() => setIsNewDanmaku(false), 100)
        break
      }
    }
  }, [workflow.detailSections, workflow.outputSections])

  if (!initialized) {
    return <LoadingScreen />
  }

  if (showApiError) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.95)',
          color: '#fff',
          padding: '24px 32px',
          borderRadius: '16px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ marginBottom: '12px', fontWeight: '700', fontSize: '18px' }}>API Key 验证失败</div>
          <div style={{ fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
            {apiError?.message || '请检查您的 API Key 是否正确配置'}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleGoToSettings}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              去设置
            </button>
            <button
              onClick={() => {
                setShowApiError(false)
                clearError()
                window.location.reload()
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              重试
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/outline" element={<Outline />} />
          <Route path="/detail-outline" element={<DetailOutline />} />
          <Route path="/knowledge-output" element={<KnowledgeOutput />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <Danmaku content={danmakuContent} isNew={isNewDanmaku} />
      
      {/* 全局加载指示器 */}
      {globalLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9999,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}>
            <Loader2 size={64} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#fff'
            }} />
            <span style={{
              color: '#fff',
              fontSize: '18px',
              fontWeight: '500',
            }}>加载中...</span>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <WorkflowProvider>
      <AppContent />
    </WorkflowProvider>
  )
}

export default App