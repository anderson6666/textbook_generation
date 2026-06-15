import { useState, useCallback } from 'react'
import { secureStorage } from '../utils/secureStorage'

interface ApiError {
  type: 'network' | 'api'
  message: string
}

interface UseAgnesAPI {
  loading: boolean
  apiError: ApiError | null
  generateContent: (prompt: string, maxRetries?: number) => Promise<string | null>
  validateApiKey: () => Promise<boolean>
  validateApiKeyWithConfig: (apiKey: string, apiUrl: string) => Promise<boolean>
  clearError: () => void
  saveSecureConfig: (apiKey: string, apiUrl: string) => Promise<void>
}

export function useAgnesAPI(): UseAgnesAPI {
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<ApiError | null>(null)

  const clearError = useCallback(() => {
    setApiError(null)
  }, [])

  const saveSecureConfig = useCallback(async (apiKey: string, apiUrl: string) => {
    await secureStorage.saveConfig(apiKey, apiUrl)
  }, [])

  const generateContent = useCallback(async (prompt: string, maxRetries: number = 3): Promise<string | null> => {
    setLoading(true)
    setApiError(null)

    const apiKey = secureStorage.getApiKey()

    if (!apiKey || !apiKey.trim()) {
      console.error('Agnes API Key not configured.')
      setApiError({ type: 'api', message: 'API Key 未配置，请先在设置页面配置' })
      setLoading(false)
      return null
    }

    const apiUrl = secureStorage.getApiUrl()
    const baseUrl = apiUrl.replace(/\/$/, '')

    const requestBody = JSON.stringify({
      model: 'agnes-2.0-flash',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 15000,
      temperature: 0.2
    })

    const calculateExponentialBackoff = (retryCount: number): number => {
      const baseDelay = 1000
      const backoffFactor = 2
      const maxDelay = 60000
      const delay = baseDelay * Math.pow(backoffFactor, retryCount)
      return Math.min(delay, maxDelay)
    }

    const makeRequest = async (retryCount: number): Promise<string | null> => {
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: requestBody
        })

        if (!response.ok) {
          if (response.status === 429 && retryCount < maxRetries) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10)
            const delay = retryAfter > 0 
              ? retryAfter * 1000 
              : calculateExponentialBackoff(retryCount)
            
            console.log(`429 Too Many Requests, retrying in ${delay / 1000}s (attempt ${retryCount + 1}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, delay))
            return makeRequest(retryCount + 1)
          }

          let errorBody: unknown = ''
          let errorMessage = `请求失败 (${response.status})`

          try {
            const contentType = response.headers.get('content-type') || ''

            if (contentType.includes('application/json')) {
              const json = await response.json()
              errorBody = json
              if (json.error?.message) {
                errorMessage = json.error.message
              }
            } else {
              errorBody = await response.text()
            }
          } catch {
            errorBody = ''
          }

          console.error('Agnes API request failed:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody
          })

          // API错误（非网络），直接返回错误
          setApiError({ type: 'api', message: errorMessage })
          return null
        }

        const data = await response.json()

        return (
          data.choices?.[0]?.message?.content?.trim() ||
          data.choices?.[0]?.text?.trim() ||
          null
        )
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        // 网络错误才重试
        if (retryCount < maxRetries && (errorMessage.includes('ERR_SSL_PROTOCOL_ERROR') || 
                                         errorMessage.includes('Failed to fetch') ||
                                         errorMessage.includes('NetworkError') ||
                                         errorMessage.includes('net::'))) {
          const delay = calculateExponentialBackoff(retryCount)
          console.log(`Network error, retrying in ${delay / 1000}s (attempt ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return makeRequest(retryCount + 1)
        }

        // 非网络错误，设置错误信息
        console.error('Agnes API request error:', errorMessage)
        setApiError({ type: 'api', message: `API 调用失败: ${errorMessage}` })
        return null
      }
    }

    try {
      return await makeRequest(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const validateApiKey = useCallback(async (): Promise<boolean> => {
    const apiKey = secureStorage.getApiKey()

    if (!apiKey || !apiKey.trim()) {
      setApiError({ type: 'api', message: 'API Key 未配置，请先在设置页面配置' })
      return false
    }

    const apiUrl = secureStorage.getApiUrl()
    const baseUrl = apiUrl.replace(/\/$/, '')

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'agnes-2.0-flash',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
          temperature: 0
        })
      })

      if (!response.ok) {
        let errorMessage = `API Key 验证失败 (${response.status})`
        
        try {
          const contentType = response.headers.get('content-type') || ''        
          if (contentType.includes('application/json')) {
            const json = await response.json()
            if (json.error?.message) {
              errorMessage = `API Key 验证失败: ${json.error.message}`      
            }
          }
        } catch {
          // ignore
        }

        if (response.status === 401 || response.status === 403) {
          errorMessage = '无效的 API Key，请检查您的密钥是否正确'
        }

        setApiError({ type: 'api', message: errorMessage })
        return false
      }

      setApiError(null)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setApiError({ type: 'api', message: `API Key 验证失败: ${errorMessage}` })
      return false
    }
  }, [])

  const validateApiKeyWithConfig = useCallback(async (apiKey: string, apiUrl: string): Promise<boolean> => {
    if (!apiKey || !apiKey.trim()) {
      setApiError({ type: 'api', message: 'API Key 未配置，请先在设置页面配置' })
      return false
    }

    const baseUrl = apiUrl.replace(/\/$/, '')

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'agnes-2.0-flash',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
          temperature: 0
        })
      })

      if (!response.ok) {
        let errorMessage = `API Key 验证失败 (${response.status})`
        
        try {
          const contentType = response.headers.get('content-type') || ''        
          if (contentType.includes('application/json')) {
            const json = await response.json()
            if (json.error?.message) {
              errorMessage = `API Key 验证失败: ${json.error.message}`      
            }
          }
        } catch {
          // ignore
        }

        if (response.status === 401 || response.status === 403) {
          errorMessage = '无效的 API Key，请检查您的密钥是否正确'
        }

        setApiError({ type: 'api', message: errorMessage })
        return false
      }

      setApiError(null)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setApiError({ type: 'api', message: `API Key 验证失败: ${errorMessage}` })
      return false
    }
  }, [])

  return { loading, apiError, generateContent, validateApiKey, validateApiKeyWithConfig, clearError, saveSecureConfig }
}