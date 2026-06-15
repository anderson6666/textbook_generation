import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, RefreshCw, Globe, Palette, Bell, Database, Zap, Check, ExternalLink, Loader2, Shield } from 'lucide-react'
import { useWorkflow } from '../context/WorkflowContext'
import { useAgnesAPI } from '../hooks/useAgnesAPI'
import { secureStorage } from '../utils/secureStorage'

function Settings() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState(secureStorage.getApiKey())
  const [apiUrl, setApiUrl] = useState(secureStorage.getApiUrl())
  
  // 初始化时加载配置
  useEffect(() => {
    const config = secureStorage.loadConfig()
    if (config) {
      setApiKey(config.apiKey)
      setApiUrl(config.apiUrl)
    }
  }, [])
  
  const [outlineApiKey, setOutlineApiKey] = useState(localStorage.getItem('outlineApiKey') || '')
  const [outlineApiUrl, setOutlineApiUrl] = useState(localStorage.getItem('outlineApiUrl') || '')
  
  const [detailApiKey, setDetailApiKey] = useState(localStorage.getItem('detailApiKey') || '')
  const [detailApiUrl, setDetailApiUrl] = useState(localStorage.getItem('detailApiUrl') || '')
  
  const [outputApiKey, setOutputApiKey] = useState(localStorage.getItem('outputApiKey') || '')
  const [outputApiUrl, setOutputApiUrl] = useState(localStorage.getItem('outputApiUrl') || '')
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'zh')
  const [notifications, setNotifications] = useState(localStorage.getItem('notifications') === 'true')
  const [autoSave, setAutoSave] = useState(localStorage.getItem('autoSave') === 'true')
  const [showSaved, setShowSaved] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null)
  const [validationMessage, setValidationMessage] = useState('')
  const [apiKeyModified, setApiKeyModified] = useState(false)
  const { workflow, setWorkflowEnabled, setIsRunning, setCurrentStep } = useWorkflow()
  const { validateApiKey, validateApiKeyWithConfig, apiError, clearError } = useAgnesAPI()

  useEffect(() => {
    if (!autoSave) return
    
    const saveTimeout = setTimeout(async () => {
      // 如果API Key有修改，先验证
      if (apiKeyModified && apiKey && apiKey.trim()) {
        clearError()
        
        // 直接使用当前输入的 apiKey 和 apiUrl 进行验证
        const isValid = await validateApiKeyWithConfig(apiKey, apiUrl)
        
        if (isValid) {
          // 验证通过后加密保存
          secureStorage.saveConfig(apiKey, apiUrl)
          setApiKeyModified(false)
          setValidationResult('success')
          setValidationMessage('API Key 验证通过，已加密保存')
          setTimeout(() => setValidationResult(null), 3000)
        } else {
          setValidationResult('error')
          setValidationMessage(apiError?.message || 'API Key 验证失败')
          setApiKey('')
          secureStorage.clearConfig()
          localStorage.removeItem('agnesApiKey')
          return
        }
      } else if (apiKey === '') {
        secureStorage.clearConfig()
        localStorage.removeItem('agnesApiKey')
      }
      
      // 保存其他配置到 localStorage
      localStorage.setItem('outlineApiKey', outlineApiKey)
      localStorage.setItem('outlineApiUrl', outlineApiUrl)
      localStorage.setItem('detailApiKey', detailApiKey)
      localStorage.setItem('detailApiUrl', detailApiUrl)
      localStorage.setItem('outputApiKey', outputApiKey)
      localStorage.setItem('outputApiUrl', outputApiUrl)
      localStorage.setItem('theme', theme)
      localStorage.setItem('language', language)
      localStorage.setItem('notifications', notifications.toString())
      localStorage.setItem('autoSave', autoSave.toString())
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    }, 500)

    return () => clearTimeout(saveTimeout)
  }, [apiKey, apiUrl, outlineApiKey, outlineApiUrl, detailApiKey, detailApiUrl, outputApiKey, outputApiUrl, theme, language, notifications, autoSave, apiKeyModified, validateApiKeyWithConfig, apiError, clearError])

  const handleSave = async () => {
    // 如果填写了API Key，先验证
    if (apiKey && apiKey.trim()) {
      setValidating(true)
      setValidationResult(null)
      clearError()
      
      // 使用安全存储保存以便验证
      secureStorage.saveConfig(apiKey, apiUrl)
      
      const isValid = await validateApiKey()
      
      if (isValid) {
        setValidationResult('success')
        setValidationMessage('API Key 验证通过，已加密保存')
      } else {
        setValidationResult('error')
        setValidationMessage(apiError?.message || 'API Key 验证失败')
        setApiKey('')
        secureStorage.clearConfig()
        localStorage.removeItem('agnesApiKey')
        setValidating(false)
        return
      }
    } else if (apiKey === '') {
      // 清除配置
      secureStorage.clearConfig()
      localStorage.removeItem('agnesApiKey')
    }
    
    // 停止所有运行任务
    setIsRunning(false)
    setCurrentStep(null)
    
    // 保存其他配置到 localStorage
    localStorage.setItem('outlineApiKey', outlineApiKey)
    localStorage.setItem('outlineApiUrl', outlineApiUrl)
    localStorage.setItem('detailApiKey', detailApiKey)
    localStorage.setItem('detailApiUrl', detailApiUrl)
    localStorage.setItem('outputApiKey', outputApiKey)
    localStorage.setItem('outputApiUrl', outputApiUrl)
    localStorage.setItem('theme', theme)
    localStorage.setItem('language', language)
    localStorage.setItem('notifications', notifications.toString())
    localStorage.setItem('autoSave', autoSave.toString())
    
    setValidating(false)
    setShowSaved(true)
    setTimeout(() => {
      setShowSaved(false)
      setValidationResult(null)
      // 返回首页
      navigate('/')
    }, 1500)
  }

  const handleReset = () => {
    setApiKey('')
    setApiUrl('https://apihub.agnes-ai.com/v1')
    setOutlineApiKey('')
    setOutlineApiUrl('')
    setDetailApiKey('')
    setDetailApiUrl('')
    setOutputApiKey('')
    setOutputApiUrl('')
    setTheme('dark')
    setLanguage('zh')
    setNotifications(true)
    setAutoSave(true)
    
    if (!autoSave) {
      handleSave()
    }
  }

  return (
    <div className="settings-page">
      {validationResult && (
        <div className={`validation-message ${validationResult}`}>
          {validationResult === 'success' ? (
            <>
              <Check size={16} />
              {validationMessage}
            </>
          ) : (
            <>
              <span style={{ fontSize: '16px' }}>⚠</span>
              {validationMessage}
            </>
          )}
        </div>
      )}
      
      <div className="page-header">
        <h1 className="page-title">设置</h1>
        <p className="page-desc">配置Agnes AI API和编辑器偏好设置</p>
      </div>

      <div className="security-badge">
        <Shield size={20} />
        <span>国防级加密保护</span>
        <span className="security-detail">API Key采用AES-256加密存储，保护您的密钥安全</span>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3 className="card-title">
            <Database className="card-icon" />
            Agnes AI API配置（通用）
          </h3>
          <p className="api-hint">当以下专项API未配置时，将使用此通用配置</p>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <input
              type="password"
              className="input-field"
              placeholder="请输入Agnes AI API Key"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setApiKeyModified(true)
              }}
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

        <div className="settings-card api-section">
          <h3 className="card-title">
            <Globe className="card-icon" />
            大纲生成 API 配置
          </h3>
          <p className="api-hint">用于生成教科书大纲</p>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <input
              type="password"
              className="input-field"
              placeholder="大纲生成专用API Key（留空使用通用配置）"
              value={outlineApiKey}
              onChange={(e) => setOutlineApiKey(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">API 端点</label>
            <input
              type="text"
              className="input-field"
              placeholder="大纲生成API URL（留空使用通用配置）"
              value={outlineApiUrl}
              onChange={(e) => setOutlineApiUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="settings-card api-section">
          <h3 className="card-title">
            <Zap className="card-icon" />
            细纲分点 API 配置
          </h3>
          <p className="api-hint">用于将大纲细化为知识点</p>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <input
              type="password"
              className="input-field"
              placeholder="细纲分点专用API Key（留空使用通用配置）"
              value={detailApiKey}
              onChange={(e) => setDetailApiKey(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">API 端点</label>
            <input
              type="text"
              className="input-field"
              placeholder="细纲分点API URL（留空使用通用配置）"
              value={detailApiUrl}
              onChange={(e) => setDetailApiUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="settings-card api-section">
          <h3 className="card-title">
            <Bell className="card-icon" />
            知识输出 API 配置
          </h3>
          <p className="api-hint">用于生成详细知识内容</p>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <input
              type="password"
              className="input-field"
              placeholder="知识输出专用API Key（留空使用通用配置）"
              value={outputApiKey}
              onChange={(e) => setOutputApiKey(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">API 端点</label>
            <input
              type="text"
              className="input-field"
              placeholder="知识输出API URL（留空使用通用配置）"
              value={outputApiUrl}
              onChange={(e) => setOutputApiUrl(e.target.value)}
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
          disabled={validating}
        >
          <RefreshCw size={16} />
          重置默认
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleSave}
          disabled={validating}
        >
          {validating ? (
            <>
              <Loader2 size={16} className="spin" />
              验证中...
            </>
          ) : showSaved ? (
            <>
              <Check size={16} />
              已保存
            </>
          ) : (
            <>
              <Save size={16} />
              保存设置
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default Settings