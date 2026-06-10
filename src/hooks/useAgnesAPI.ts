import { useState, useCallback } from 'react'

interface UseAgnesAPI {
  loading: boolean
  generateContent: (prompt: string) => Promise<string | null>
}

export function useAgnesAPI(): UseAgnesAPI {
  const [loading, setLoading] = useState(false)

  const generateContent = useCallback(async (prompt: string): Promise<string | null> => {
    setLoading(true)

    try {
      const apiKey = localStorage.getItem('agnesApiKey')

      if (!apiKey || !apiKey.trim()) {
        console.error('Agnes API Key not configured.')
        return null
      }

      const apiUrl = localStorage.getItem('agnesApiUrl') || 'https://apihub.agnes-ai.com/v1'
      const baseUrl = apiUrl.replace(/\/$/, '')

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
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
      })

      if (!response.ok) {
        let errorBody: unknown = ''

        try {
          const contentType = response.headers.get('content-type') || ''

          if (contentType.includes('application/json')) {
            errorBody = await response.json()
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
      console.error('Agnes API request error:', errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, generateContent }
}
