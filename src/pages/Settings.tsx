import { useState, useEffect } from 'react'
import { Save, RefreshCw, Globe, Palette, Bell, Database, Zap, Check, ExternalLink } from 'lucide-react'
import { useWorkflow } from '../context/WorkflowContext'

function Settings() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('agnesApiKey') || '')
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('agnesApiUrl') || 'https://apihub.agnes-ai.com/v1')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'zh')
  const [notifications, setNotifications] = useState(localStorage.getItem('notifications') === 'true')
  const [autoSave, setAutoSave] = useState(localStorage.getItem('autoSave') === 'true')
  const [showSaved, setShowSaved] = useState(false)
  const { workflow, setWorkflowEnabled } = useWorkflow()

  // 自动保存设置到localStorage
  useEffect(() => {
    if (!autoSave) return
    
    const saveTimeout = setTimeout(() => {
      localStorage.setItem('agnesApiKey', apiKey)
      localStorage.setItem('agnesApiUrl', apiUrl)
      localStorage.setItem('theme', theme)
      localStorage.setItem('language', language)
      localStorage.setItem('notifications', notifications.toString())
      localStorage.setItem('autoSave', autoSave.toString())
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    }, 500)

    return () => clearTimeout(saveTimeout)
  }, [apiKey, apiUrl, theme, language, notifications, autoSave])

  const handleSave = () => {
    localStorage.setItem('agnesApiKey', apiKey)
    localStorage.setItem('agnesApiUrl', apiUrl)
    localStorage.setItem('theme', theme)
    localStorage.setItem('language', language)
    localStorage.setItem('notifications', notifications.toString())
    localStorage.setItem('autoSave', autoSave.toString())
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const handleReset = () => {
    setApiKey('')
    setApiUrl('https://apihub.agnes-ai.com/v1')
    setTheme('dark')
    setLanguage('zh')
    setNotifications(true)
    setAutoSave(true)
    
    // 如果开启了自动保存，会自动保存到localStorage
    if (!autoSave) {
      handleSave()
    }
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">设置</h1>
        <p className="page-desc">配置Agnes AI API和编辑器偏好设置</p>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3 className="card-title">
            <Database className="card-icon" />
            Agnes AI API配置
          </h3>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <input
              type="password"
              className="input-field"
              placeholder="请输入Agnes AI API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <a 
              href="https://platform.agnes-ai.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="api-link"
            >
              <ExternalLink size={14} />
              获取 API Key
            </a>
          </div>
          <div className="form-group">
            <label className="form-label">API 端点</label>
            <input
              type="text"
              className="input-field"
              placeholder="Agnes AI API URL"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="settings-card">
          <h3 className="card-title">
            <Palette className="card-icon" />
            外观设置
          </h3>
          <div className="form-group">
            <label className="form-label">主题模式</label>
            <select 
              className="select-field"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="dark">深色模式</option>
              <option value="light">浅色模式</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">语言</label>
            <select 
              className="select-field"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="card-title">
            <Bell className="card-icon" />
            通知设置
          </h3>
          <div className="form-group">
            <label className="form-label">启用通知</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="notifications"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              <label htmlFor="notifications" className="toggle-label" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">自动保存</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="autoSave"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
              />
              <label htmlFor="autoSave" className="toggle-label" />
            </div>
            <p className="auto-save-hint">开启后，设置会自动保存到本地</p>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="card-title">
            <Zap className="card-icon" />
            一键工作流
          </h3>
          <div className="form-group">
            <label className="form-label">启用一键工作流</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="workflow"
                checked={workflow.enabled}
                onChange={(e) => setWorkflowEnabled(e.target.checked)}
              />
              <label htmlFor="workflow" className="toggle-label" />
            </div>
          </div>
          <p className="workflow-desc">
            开启后，从大纲目录开始，自动进入下一个工作区，
            并实时预览最终结果。
          </p>
        </div>

        <div className="settings-card">
          <h3 className="card-title">
            <Globe className="card-icon" />
            关于
          </h3>
          <div className="about-info">
            <div className="info-item">
              <span className="info-label">版本</span>
              <span className="info-value">v1.0.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">开发</span>
              <span className="info-value">Agnes AI Team</span>
            </div>
            <div className="info-item">
              <span className="info-label">官网</span>
              <a href="https://agnes-ai.com" target="_blank" rel="noopener noreferrer" className="info-link">
                agnes-ai.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          className="btn btn-secondary"
          onClick={handleReset}
        >
          <RefreshCw size={16} />
          重置默认
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleSave}
        >
          {showSaved ? <Check size={16} /> : <Save size={16} />}
          {showSaved ? '已保存' : '保存设置'}
        </button>
      </div>
    </div>
  )
}

export default Settings