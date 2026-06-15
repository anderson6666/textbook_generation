const STORAGE_KEY = 'agnes_config_v3'

interface StoredConfig {
  apiKey: string
  apiUrl: string
  encrypted: boolean
  timestamp: number
}

// 简单的加密（XOR + Base64）
const simpleEncrypt = (text: string, key: string): string => {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result)
}

const simpleDecrypt = (encryptedText: string, key: string): string => {
  try {
    const decoded = atob(encryptedText)
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return result
  } catch {
    return ''
  }
}

// 生成固定的加密密钥
const getEncryptionKey = (): string => {
  let key = localStorage.getItem('__agnes_enc_key')
  if (!key) {
    key = 'agnes_secure_key_2024' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('__agnes_enc_key', key)
  }
  return key
}

// 全局配置缓存
let configCache: { apiKey: string; apiUrl: string } | null = null

export const secureStorage = {
  saveConfig(apiKey: string, apiUrl: string): void {
    const key = getEncryptionKey()
    const config: StoredConfig = {
      apiKey: simpleEncrypt(apiKey, key),
      apiUrl: simpleEncrypt(apiUrl, key),
      encrypted: true,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    
    // 更新缓存
    configCache = { apiKey, apiUrl }
    
    // 同时保存到 sessionStorage 用于同步读取
    sessionStorage.setItem('temp_api_key', apiKey)
    sessionStorage.setItem('temp_api_url', apiUrl)
  },
  
  loadConfig(): { apiKey: string; apiUrl: string } | null {
    // 先检查缓存
    if (configCache) return configCache
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        // 兼容旧版本
        const oldKey = localStorage.getItem('agnesApiKey')
        const oldUrl = localStorage.getItem('agnesApiUrl')
        if (oldKey) {
          const result = { apiKey: oldKey, apiUrl: oldUrl || 'https://apihub.agnes-ai.com/v1' }
          configCache = result
          sessionStorage.setItem('temp_api_key', oldKey)
          sessionStorage.setItem('temp_api_url', result.apiUrl)
          return result
        }
        return null
      }
      
      const config = JSON.parse(stored) as StoredConfig
      if (!config.apiKey || !config.apiUrl) return null
      
      const key = getEncryptionKey()
      const apiKey = config.encrypted ? simpleDecrypt(config.apiKey, key) : config.apiKey
      const apiUrl = config.encrypted ? simpleDecrypt(config.apiUrl, key) : config.apiUrl
      
      if (!apiKey) return null
      
      configCache = { apiKey, apiUrl }
      sessionStorage.setItem('temp_api_key', apiKey)
      sessionStorage.setItem('temp_api_url', apiUrl)
      
      return { apiKey, apiUrl }
    } catch {
      return null
    }
  },
  
  async loadConfigAsync(): Promise<{ apiKey: string; apiUrl: string } | null> {
    return this.loadConfig()
  },
  
  clearConfig(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('__agnes_enc_key')
    sessionStorage.removeItem('temp_api_key')
    sessionStorage.removeItem('temp_api_url')
    configCache = null
  },
  
  getApiKey(): string {
    // 先检查缓存
    if (configCache) return configCache.apiKey
    
    // 检查 sessionStorage
    const temp = sessionStorage.getItem('temp_api_key')
    if (temp) return temp
    
    // 尝试同步加载
    const config = this.loadConfig()
    return config?.apiKey || ''
  },
  
  getApiUrl(): string {
    if (configCache) return configCache.apiUrl
    
    const temp = sessionStorage.getItem('temp_api_url')
    if (temp) return temp
    
    const config = this.loadConfig()
    return config?.apiUrl || 'https://apihub.agnes-ai.com/v1'
  },
  
  setSessionCache(apiKey: string, apiUrl: string): void {
    sessionStorage.setItem('temp_api_key', apiKey)
    sessionStorage.setItem('temp_api_url', apiUrl)
    configCache = { apiKey, apiUrl }
  }
}

export const legacyStorage = {
  saveConfig(apiKey: string, apiUrl: string): void {
    localStorage.setItem('agnesApiKey', apiKey)
    localStorage.setItem('agnesApiUrl', apiUrl)
  },
  
  getApiKey(): string {
    return localStorage.getItem('agnesApiKey') || ''
  },
  
  getApiUrl(): string {
    return localStorage.getItem('agnesApiUrl') || 'https://apihub.agnes-ai.com/v1'
  },
  
  clearConfig(): void {
    localStorage.removeItem('agnesApiKey')
    localStorage.removeItem('agnesApiUrl')
  }
}
