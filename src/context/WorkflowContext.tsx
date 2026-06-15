import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { indexedDBStorage } from '../utils/indexedDB'

interface WorkflowState {
  enabled: boolean
  currentStep: 'outline' | 'detail' | 'output' | null
  currentChapterIndex: number
  currentOutputIndex: number
  outline: string
  outlineChapters: string[]
  detail: string
  detailSections: Record<string, string>
  output: string
  outputSections: Record<string, string>
  isRunning: boolean
  parallelMode: boolean
  detailAheadCount: number
  parallelTaskCount: number
  maxParallelTasks: number
  runningDetailTasks: string[]
  runningOutputTasks: string[]
  generatedPrompt: string
}

interface WorkflowHistory {
  topic: string
  timestamp: number
  outline: string
  outlineChapters: string[]
  detailSections: Record<string, string>
  output: string
  outputSections: Record<string, string>
  generatedPrompt: string
}

interface WorkflowContextType {
  workflow: WorkflowState
  history: WorkflowHistory[]
  initialized: boolean
  setWorkflowEnabled: (enabled: boolean) => void
  setCurrentStep: (step: 'outline' | 'detail' | 'output' | null) => void
  setCurrentChapterIndex: (index: number) => void
  setCurrentOutputIndex: (index: number) => void
  updateOutline: (outline: string) => void
  updateOutlineChapters: (chapters: string[]) => void
  updateDetail: (chapter: string, detail: string) => void
  updateOutput: (output: string) => void
  updateOutputSection: (chapter: string, content: string) => void
  setIsRunning: (running: boolean) => void
  setParallelMode: (enabled: boolean) => void
  setDetailAheadCount: (count: number) => void
  addRunningDetailTask: (chapter: string) => void
  removeRunningDetailTask: (chapter: string) => void
  addRunningOutputTask: (chapter: string) => void
  removeRunningOutputTask: (chapter: string) => void
  resetWorkflow: () => void
  saveToHistory: (topic: string) => void
  loadFromHistory: (index: number) => void
  deleteHistory: (index: number) => void
  clearCurrentProgress: () => void
  setGeneratedPrompt: (prompt: string) => void
}

const initialState: WorkflowState = {
  enabled: false,
  currentStep: null,
  currentChapterIndex: 0,
  currentOutputIndex: 0,
  outline: '',
  outlineChapters: [],
  detail: '',
  detailSections: {},
  output: '',
  outputSections: {},
  isRunning: false,
  parallelMode: false,
  detailAheadCount: 3,
  parallelTaskCount: 0,
  maxParallelTasks: 4,
  runningDetailTasks: [],
  runningOutputTasks: [],
  generatedPrompt: '',
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflow, setWorkflow] = useState<WorkflowState>(initialState)
  const [history, setHistory] = useState<WorkflowHistory[]>([])
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeData = async () => {
      try {
        const savedProgress = await indexedDBStorage.getItem('workflowProgress')
        const savedHistory = await indexedDBStorage.getItem('workflowHistory')
        const savedEnabled = await indexedDBStorage.getItem('workflowEnabled')

        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress) as {
              outlineChapters?: string[]
              detailSections?: Record<string, string>
              outputSections?: Record<string, string>
              generatedPrompt?: string
              currentStep?: 'outline' | 'detail' | 'output' | null
              [key: string]: unknown
            }
            
            const validChapters = new Set(parsed.outlineChapters?.filter((ch: string) => ch && ch.trim()) || [])
            
            const filteredDetailSections: Record<string, string> = {}
            const filteredOutputSections: Record<string, string> = {}
            
            for (const [chapter, content] of Object.entries(parsed.detailSections || {})) {
              if (validChapters.has(chapter) && typeof content === 'string') {
                filteredDetailSections[chapter] = content
              }
            }
            
            for (const [chapter, content] of Object.entries(parsed.outputSections || {})) {
              if (validChapters.has(chapter) && typeof content === 'string') {
                filteredOutputSections[chapter] = content
              }
            }
            
            const hasOutline = parsed.outline && typeof parsed.outline === 'string' && parsed.outline.trim().length > 0
            const hasDetail = Object.keys(filteredDetailSections).length > 0
            const hasOutput = Object.keys(filteredOutputSections).length > 0
            
            // 只有当有对应步骤的实际内容时才恢复 currentStep，避免状态不一致
            const savedStep = parsed.currentStep as 'outline' | 'detail' | 'output' | null
            let shouldRestoreStep = false
            if (savedStep === 'outline' && hasOutline) {
              shouldRestoreStep = true
            } else if (savedStep === 'detail' && hasDetail) {
              shouldRestoreStep = true
            } else if (savedStep === 'output' && hasOutput) {
              shouldRestoreStep = true
            }
            
            setWorkflow(prev => ({
              ...prev,
              ...parsed,
              detailSections: filteredDetailSections,
              outputSections: filteredOutputSections,
              enabled: savedEnabled === 'true',
              isRunning: false,
              currentStep: shouldRestoreStep ? savedStep : null,
              generatedPrompt: parsed.generatedPrompt || '',
            }))
          } catch {
            console.warn('Failed to parse saved progress')
          }
        }

        if (savedHistory) {
          try {
            setHistory(JSON.parse(savedHistory))
          } catch {
            console.warn('Failed to parse saved history')
          }
        }
      } catch (error) {
        console.error('Error during initialization:', error)
      } finally {
        setInitialized(true)
      }
    }

    initializeData()
  }, [])

  useEffect(() => {
    if (!initialized) return

    const saveProgress = async () => {
      const progressToSave = {
        currentStep: workflow.currentStep,
        currentChapterIndex: workflow.currentChapterIndex,
        currentOutputIndex: workflow.currentOutputIndex,
        outline: workflow.outline,
        outlineChapters: workflow.outlineChapters,
        detail: workflow.detail,
        detailSections: workflow.detailSections,
        output: workflow.output,
        outputSections: workflow.outputSections,
        parallelMode: workflow.parallelMode,
        detailAheadCount: workflow.detailAheadCount,
        generatedPrompt: workflow.generatedPrompt,
      }
      await indexedDBStorage.setItem('workflowProgress', JSON.stringify(progressToSave))
      await indexedDBStorage.setItem('workflowEnabled', workflow.enabled.toString())
    }

    saveProgress()
  }, [workflow, initialized])

  useEffect(() => {
    if (!initialized) return

    // 保存所有历史记录（无限制）
    indexedDBStorage.setItem('workflowHistory', JSON.stringify(history))
  }, [history, initialized])

  const setWorkflowEnabled = useCallback((enabled: boolean) => {
    setWorkflow(prev => ({ ...prev, enabled }))
  }, [])

  const setCurrentStep = useCallback((step: 'outline' | 'detail' | 'output' | null) => {
    setWorkflow(prev => ({ ...prev, currentStep: step }))
  }, [])

  const setCurrentChapterIndex = useCallback((index: number) => {
    setWorkflow(prev => ({ ...prev, currentChapterIndex: index }))
  }, [])

  const setCurrentOutputIndex = useCallback((index: number) => {
    setWorkflow(prev => ({ ...prev, currentOutputIndex: index }))
  }, [])

  const updateOutline = useCallback((outline: string) => {
    setWorkflow(prev => ({ ...prev, outline }))
  }, [])

  const updateOutlineChapters = useCallback((chapters: string[]) => {
    setWorkflow(prev => {
      return { 
        ...prev, 
        outlineChapters: chapters, 
        currentChapterIndex: 0,
        detailSections: {},
        outputSections: {},
        output: '',
      }
    })
  }, [])

  const updateDetail = useCallback((chapter: string, detail: string) => {
    setWorkflow(prev => ({
      ...prev,
      detail: detail,
      detailSections: {
        ...prev.detailSections,
        [chapter]: detail,
      },
    }))
  }, [])

  const updateOutput = useCallback((output: string) => {
    setWorkflow(prev => ({ ...prev, output }))
  }, [])

  const updateOutputSection = useCallback((chapter: string, content: string) => {
    setWorkflow(prev => ({
      ...prev,
      outputSections: {
        ...prev.outputSections,
        [chapter]: content,
      },
    }))
  }, [])

  const setIsRunning = useCallback((running: boolean) => {
    setWorkflow(prev => ({ ...prev, isRunning: running }))
  }, [])

  const setParallelMode = useCallback((enabled: boolean) => {
    setWorkflow(prev => ({ ...prev, parallelMode: enabled }))
  }, [])

  const setDetailAheadCount = useCallback((count: number) => {
    setWorkflow(prev => ({ ...prev, detailAheadCount: count }))
  }, [])

  const addRunningDetailTask = useCallback((chapter: string) => {
    setWorkflow(prev => ({
      ...prev,
      runningDetailTasks: [...prev.runningDetailTasks, chapter],
      parallelTaskCount: prev.parallelTaskCount + 1,
    }))
  }, [])

  const removeRunningDetailTask = useCallback((chapter: string) => {
    setWorkflow(prev => ({
      ...prev,
      runningDetailTasks: prev.runningDetailTasks.filter(t => t !== chapter),
      parallelTaskCount: Math.max(0, prev.parallelTaskCount - 1),
    }))
  }, [])

  const addRunningOutputTask = useCallback((chapter: string) => {
    setWorkflow(prev => ({
      ...prev,
      runningOutputTasks: [...prev.runningOutputTasks, chapter],
      parallelTaskCount: prev.parallelTaskCount + 1,
    }))
  }, [])

  const removeRunningOutputTask = useCallback((chapter: string) => {
    setWorkflow(prev => ({
      ...prev,
      runningOutputTasks: prev.runningOutputTasks.filter(t => t !== chapter),
      parallelTaskCount: Math.max(0, prev.parallelTaskCount - 1),
    }))
  }, [])

  const resetWorkflow = useCallback(() => {
    setWorkflow({ ...initialState, enabled: false })
  }, [])

  const saveToHistory = useCallback((topic: string) => {
    const newHistoryItem: WorkflowHistory = {
      topic,
      timestamp: Date.now(),
      outline: workflow.outline,
      outlineChapters: workflow.outlineChapters,
      detailSections: workflow.detailSections,
      output: workflow.output,
      outputSections: workflow.outputSections,
      generatedPrompt: workflow.generatedPrompt,
    }
    setHistory(prev => {
      const filtered = prev.filter(item => item.topic !== topic)
      return [...filtered, newHistoryItem]
    })
  }, [workflow])

  const loadFromHistory = useCallback((index: number) => {
    const item = history[index]
    if (item) {
      const hasDetail = Object.keys(item.detailSections).length > 0
      const hasOutput = Object.keys(item.outputSections).length > 0
      let step: 'outline' | 'detail' | 'output' | null = 'outline'
      
      if (hasOutput && hasDetail) {
        step = 'output'
      } else if (hasDetail) {
        step = 'detail'
      } else {
        step = 'outline'
      }

      const validChapters = new Set(item.outlineChapters.filter(ch => ch && ch.trim()))
      
      const filteredDetailSections: Record<string, string> = {}
      const filteredOutputSections: Record<string, string> = {}
      
      for (const [chapter, content] of Object.entries(item.detailSections)) {
        if (validChapters.has(chapter)) {
          filteredDetailSections[chapter] = content
        }
      }
      
      for (const [chapter, content] of Object.entries(item.outputSections)) {
        if (validChapters.has(chapter)) {
          filteredOutputSections[chapter] = content
        }
      }
      
      setWorkflow(prev => ({
        ...prev,
        enabled: true,
        outline: item.outline,
        outlineChapters: item.outlineChapters,
        detailSections: filteredDetailSections,
        output: item.output,
        outputSections: filteredOutputSections,
        currentStep: step,
        generatedPrompt: item.generatedPrompt || '',
      }))
    }
  }, [history])

  const deleteHistory = useCallback((index: number) => {
    setHistory(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearCurrentProgress = useCallback(() => {
    indexedDBStorage.removeItem('workflowProgress')
    setWorkflow({ ...initialState, enabled: false })
  }, [])

  const setGeneratedPrompt = useCallback((prompt: string) => {
    setWorkflow(prev => ({ ...prev, generatedPrompt: prompt }))
  }, [])

  return (
    <WorkflowContext.Provider
      value={{
        workflow,
        history,
        initialized,
        setWorkflowEnabled,
        setCurrentStep,
        setCurrentChapterIndex,
        setCurrentOutputIndex,
        updateOutline,
        updateOutlineChapters,
        updateDetail,
        updateOutput,
        updateOutputSection,
        setIsRunning,
        setParallelMode,
        setDetailAheadCount,
        addRunningDetailTask,
        removeRunningDetailTask,
        addRunningOutputTask,
        removeRunningOutputTask,
        resetWorkflow,
        saveToHistory,
        loadFromHistory,
        deleteHistory,
        clearCurrentProgress,
        setGeneratedPrompt,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  const context = useContext(WorkflowContext)
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider')
  }
  return context
}
