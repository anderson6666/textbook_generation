import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

interface WorkflowState {
  enabled: boolean
  currentStep: 'outline' | 'detail' | 'output' | null
  currentChapterIndex: number
  outline: string
  outlineChapters: string[]
  detail: string
  detailSections: Record<string, string>
  output: string
  outputSections: Record<string, string>
  isRunning: boolean
}

interface WorkflowHistory {
  timestamp: number
  topic: string
  outline: string
  outlineChapters: string[]
  detailSections: Record<string, string>
  output: string
  outputSections: Record<string, string>
}

interface WorkflowContextType {
  workflow: WorkflowState
  history: WorkflowHistory[]
  setWorkflowEnabled: (enabled: boolean) => void
  updateOutline: (outline: string) => void
  updateOutlineChapters: (chapters: string[]) => void
  updateDetail: (chapter: string, detail: string) => void
  updateOutput: (output: string) => void
  updateOutputSection: (chapter: string, content: string) => void
  setCurrentStep: (step: 'outline' | 'detail' | 'output' | null) => void
  setCurrentChapterIndex: (index: number) => void
  setIsRunning: (running: boolean) => void
  resetWorkflow: () => void
  saveToHistory: (topic: string) => void
  loadFromHistory: (index: number) => void
  deleteHistory: (index: number) => void
  clearCurrentProgress: () => void
}

const initialState: WorkflowState = {
  enabled: false,
  currentStep: null,
  currentChapterIndex: 0,
  outline: '',
  outlineChapters: [],
  detail: '',
  detailSections: {},
  output: '',
  outputSections: {},
  isRunning: false,
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  // 从localStorage加载保存的状态
  const [workflow, setWorkflow] = useState<WorkflowState>(() => {
    const saved = localStorage.getItem('workflowEnabled')
    const savedProgress = localStorage.getItem('workflowProgress')
    
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress)
        return {
          ...initialState,
          enabled: saved === 'true',
          ...parsed,
          // 确保新字段有默认值
          outputSections: parsed.outputSections || {},
        }
      } catch {
        return {
          ...initialState,
          enabled: saved === 'true',
        }
      }
    }
    
    return {
      ...initialState,
      enabled: saved === 'true',
    }
  })

  // 从localStorage加载历史
  const [history, setHistory] = useState<WorkflowHistory[]>(() => {
    const savedHistory = localStorage.getItem('workflowHistory')
    if (savedHistory) {
      try {
        return JSON.parse(savedHistory)
      } catch {
        return []
      }
    }
    return []
  })

  // 自动保存工作流进度
  useEffect(() => {
    const progressToSave = {
      currentStep: workflow.currentStep,
      currentChapterIndex: workflow.currentChapterIndex,
      outline: workflow.outline,
      outlineChapters: workflow.outlineChapters,
      detail: workflow.detail,
      detailSections: workflow.detailSections,
      output: workflow.output,
      outputSections: workflow.outputSections,
    }
    localStorage.setItem('workflowProgress', JSON.stringify(progressToSave))
  }, [workflow.currentStep, workflow.currentChapterIndex, workflow.outline, workflow.outlineChapters, workflow.detail, workflow.detailSections, workflow.output, workflow.outputSections])

  // 保存历史到localStorage
  useEffect(() => {
    localStorage.setItem('workflowHistory', JSON.stringify(history))
  }, [history])

  const setWorkflowEnabled = useCallback((enabled: boolean) => {
    setWorkflow(prev => ({ ...prev, enabled }))
    localStorage.setItem('workflowEnabled', enabled.toString())
  }, [])

  const updateOutline = useCallback((outline: string) => {
    setWorkflow(prev => ({ ...prev, outline }))
  }, [])

  const updateOutlineChapters = useCallback((chapters: string[]) => {
    setWorkflow(prev => ({ ...prev, outlineChapters: chapters, currentChapterIndex: 0 }))
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

  const setCurrentStep = useCallback((step: 'outline' | 'detail' | 'output' | null) => {
    setWorkflow(prev => ({ ...prev, currentStep: step }))
  }, [])

  const setCurrentChapterIndex = useCallback((index: number) => {
    setWorkflow(prev => ({ ...prev, currentChapterIndex: index }))
  }, [])

  const setIsRunning = useCallback((running: boolean) => {
    setWorkflow(prev => ({ ...prev, isRunning: running }))
  }, [])

  const resetWorkflow = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      currentStep: null,
      currentChapterIndex: 0,
      outline: '',
      outlineChapters: [],
      detail: '',
      detailSections: {},
      output: '',
      outputSections: {},
      isRunning: false,
    }))
    localStorage.removeItem('workflowProgress')
  }, [])

  const clearCurrentProgress = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      currentStep: null,
      currentChapterIndex: 0,
      outline: '',
      outlineChapters: [],
      detail: '',
      detailSections: {},
      output: '',
      outputSections: {},
      isRunning: false,
    }))
    localStorage.removeItem('workflowProgress')
  }, [])

  const saveToHistory = useCallback((topic: string) => {
    const newHistory: WorkflowHistory = {
      timestamp: Date.now(),
      topic,
      outline: workflow.outline,
      outlineChapters: workflow.outlineChapters,
      detailSections: workflow.detailSections,
      output: workflow.output,
      outputSections: workflow.outputSections,
    }
    setHistory(prev => [newHistory, ...prev].slice(0, 20)) // 保留最近20条
  }, [workflow.outline, workflow.outlineChapters, workflow.detailSections, workflow.output, workflow.outputSections])

  const loadFromHistory = useCallback((index: number) => {
    const item = history[index]
    if (item) {
      const outlineChapters = item.outlineChapters || []
      const detailSections = item.detailSections || {}
      
      // 找到第一个未生成细纲的小节
      let nextChapterIndex = 0
      let nextStep: 'outline' | 'detail' | 'output' | null = 'outline'
      
      if (outlineChapters.length > 0) {
        // 查找第一个没有细纲的小节
        const firstMissingIndex = outlineChapters.findIndex(
          (chapter) => !detailSections[chapter]
        )
        
        if (firstMissingIndex === -1) {
          // 所有小节都有细纲，检查是否有输出
          nextChapterIndex = outlineChapters.length - 1
          nextStep = 'output'
        } else {
          nextChapterIndex = firstMissingIndex
          nextStep = 'detail'
        }
      }
      
      setWorkflow(prev => ({
        ...prev,
        outline: item.outline,
        outlineChapters: outlineChapters,
        detailSections: detailSections,
        output: item.output,
        outputSections: item.outputSections || {},
        currentStep: nextStep,
        currentChapterIndex: nextChapterIndex,
        isRunning: false,
      }))
    }
  }, [history])

  const deleteHistory = useCallback((index: number) => {
    setHistory(prev => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <WorkflowContext.Provider
      value={{
        workflow,
        history,
        setWorkflowEnabled,
        updateOutline,
        updateOutlineChapters,
        updateDetail,
        updateOutput,
        updateOutputSection,
        setCurrentStep,
        setCurrentChapterIndex,
        setIsRunning,
        resetWorkflow,
        saveToHistory,
        loadFromHistory,
        deleteHistory,
        clearCurrentProgress,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  const context = useContext(WorkflowContext)
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider')
  }
  return context
}