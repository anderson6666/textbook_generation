import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Send,
  Loader2,
  Square,
  Copy,
  Download,
  ArrowLeft,
  Check,
  Trash2,
  Eye,
  Code2,
  Play,
} from 'lucide-react'
import { useAgnesAPI } from '../hooks/useAgnesAPI'
import { useWorkflow } from '../context/WorkflowContext'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const systemPrompt = `
你是一位专业的知识输出专家，擅长将细粒度的知识点展开为完整的学习内容。

任务：根据用户提供的章节标题和细纲内容，针对每个最细粒度的子节点（第三层及更深层级的知识点）生成详细、具体、专业的知识输出内容，确保知识不遗漏。

重要要求：
1. 必须深入到细纲中的最细粒度子节点，对每个小知识点进行详细讲解
2. 内容要深入、专业，包含该知识点的核心概念、原理和方法
3. 示例要具体、典型，有助于理解每个子知识点
4. 根据学科特点选择合适的表达方式，文科学科侧重概念解析和案例分析，理科学科可适当使用公式和模型
5. 包含多个例题，覆盖不同题型和难度
6. 提供练习题供学习者巩固

输出格式要求：
1. 使用Markdown格式
2. 如需使用数学公式，使用LaTeX格式：$...$为行内公式，$$...$$为块级公式
3. 结构清晰，按照细纲的层级结构组织内容：
   - 对每个一级要点进行章节级别的展开
   - 对每个二级要点进行小节级别的详细讲解
   - 对每个三级及更深层级的子要点进行知识点级别的深入剖析
   - 每个知识点应包含：概念定义、核心原理、典型例题、常见误区、应用场景、练习题
4. 确保覆盖细纲中的所有知识点，不遗漏任何细节

示例（知识点：高考语文阅读策略）：
# 高考语文阅读策略

## 一、核心概念

高考语文阅读考查学生在真实情境中获取信息、理解文本、分析问题的能力，包括信息类文本阅读和文学类文本阅读两大板块。

## 二、阅读策略解析

### 1. 信息类文本阅读策略
#### 1.1 快速定位法
- 定义：通过关键词快速定位关键信息的阅读方法
- 应用场景：适用于论述类、实用类文本的快速阅读
- 技巧：圈画关键词、关注首尾段、利用标点符号定位

#### 1.2 逻辑分析法
- 定义：梳理文本论证结构和逻辑关系的方法
- 应用场景：分析议论文的论点、论据和论证过程
- 技巧：识别因果关系、并列关系、对比关系

#### 1.3 比对验证法
- 定义：将选项与原文进行细致比对的解题方法
- 应用场景：客观选择题的解答
- 技巧：注意偷换概念、范围大小、因果倒置等陷阱

### 2. 文学类文本阅读策略
#### 2.1 情感体悟法
- 定义：把握作者情感倾向和主旨的阅读方法
- 应用场景：小说、散文等文学作品的赏析
- 技巧：分析抒情方式、把握意象象征意义

#### 2.2 手法赏析法
- 定义：分析文章表现手法和艺术特色的方法
- 应用场景：文学作品的鉴赏分析
- 技巧：识别修辞手法、表达方式、表现手法

#### 2.3 语境推断法
- 定义：结合上下文推断词句含义的方法
- 应用场景：理解文中重要词语和句子的含义
- 技巧：联系上下文语境、结合写作背景

## 三、典型例题与解析

请直接输出知识内容，不要添加任何开场白或解释。
`

function KnowledgeOutput() {
  const autoSaveEnabled = localStorage.getItem('autoSave') === 'true'

  const [knowledge, setKnowledge] = useState(
    localStorage.getItem('lastKnowledge') || '',
  )
  const [output, setOutput] = useState(
    localStorage.getItem('lastKnowledgeOutput') || '',
  )
  const [rawOutput, setRawOutput] = useState(
    localStorage.getItem('lastKnowledgeOutput') || '',
  )
  const [showPreview, setShowPreview] = useState(true)
  const [showSaved, setShowSaved] = useState(false)
  const [stopRequested, setStopRequested] = useState(false)
  const [currentDetailIndex, setCurrentDetailIndex] = useState(0)
  const [hasGenerated, setHasGenerated] = useState(false)

  const stopRequestedRef = useRef(false)
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { loading, generateContent } = useAgnesAPI()

  const {
    workflow,
    updateOutput,
    updateOutputSection,
    setCurrentStep,
    setIsRunning,
  } = useWorkflow()
  const isRunning = workflow.isRunning

  const detailChapters = useMemo(() => {
    return workflow.outlineChapters.filter((chapter) => {
      return chapter && chapter.trim() && workflow.detailSections?.[chapter]
    })
  }, [workflow.outlineChapters, workflow.detailSections])

  const progress =
    detailChapters.length > 0
      ? (currentDetailIndex / detailChapters.length) * 100
      : 0

  const progressText =
    detailChapters.length > 0
      ? `${currentDetailIndex} / ${detailChapters.length}`
      : ''

  const clearAutoTimer = () => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearAutoTimer()
    }
  }, [])

  useEffect(() => {
    const handleNavigate = () => {
      clearAutoTimer()
    }

    window.addEventListener('popstate', handleNavigate)

    return () => {
      window.removeEventListener('popstate', handleNavigate)
    }
  }, [])

  useEffect(() => {
    if (!knowledge && detailChapters.length > 0) {
      setKnowledge('请根据细纲中的知识点生成详细的知识输出')
    }
  }, [knowledge, detailChapters.length])

  const handleGenerateAll = useCallback(async () => {
    if (detailChapters.length === 0) return
    if (loading || isRunning) return

    stopRequestedRef.current = false
    setStopRequested(false)
    setHasGenerated(false)
    setIsRunning(true)
    setCurrentStep('output')
    setCurrentDetailIndex(0)

    const generatedSections: Record<string, string> = {}

    for (let i = 0; i < detailChapters.length; i += 1) {
      if (stopRequestedRef.current) {
        setIsRunning(false)
        return
      }

      const chapter = detailChapters[i]
      const detailContent = workflow.detailSections[chapter]

      if (!detailContent) continue

      setCurrentDetailIndex(i + 1)

      const prompt = `${systemPrompt}

章节标题：${chapter}

细纲内容：
${detailContent}`

      const response = await generateContent(prompt)

      if (stopRequestedRef.current) {
        setIsRunning(false)
        return
      }

      if (response) {
        generatedSections[chapter] = response
        updateOutputSection(chapter, response)
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    if (stopRequestedRef.current) {
      setIsRunning(false)
      return
    }

    const allOutput = detailChapters
      .map((chapter) => {
        const chapterOutput =
          generatedSections[chapter] ||
          workflow.outputSections?.[chapter] ||
          ''

        if (!chapterOutput.trim()) return ''

        return `# ${chapter}

${chapterOutput}`
      })
      .filter(Boolean)
      .join('\n\n---\n\n')

    updateOutput(allOutput)
    setOutput(allOutput)
    setRawOutput(allOutput)
    setShowPreview(true)
    setHasGenerated(true)
    setIsRunning(false)
  }, [
    detailChapters,
    workflow.detailSections,
    workflow.outputSections,
    generateContent,
    updateOutputSection,
    updateOutput,
    setCurrentStep,
    setIsRunning,
    loading,
    isRunning,
  ])

  useEffect(() => {
    if (
      workflow.enabled &&
      workflow.currentStep === 'output' &&
      detailChapters.length > 0 &&
      !loading &&
      !isRunning &&
      !hasGenerated &&
      !stopRequestedRef.current
    ) {
      clearAutoTimer()

      autoTimerRef.current = setTimeout(() => {
        if (!stopRequestedRef.current && !loading && !isRunning) {
          handleGenerateAll()
        }
      }, 800)

      return () => {
        clearAutoTimer()
      }
    }
  }, [
    workflow.enabled,
    workflow.currentStep,
    detailChapters.length,
    loading,
    isRunning,
    hasGenerated,
    handleGenerateAll,
  ])

  const handleGenerate = async () => {
    if (!knowledge.trim()) return
    if (loading || isRunning) return

    stopRequestedRef.current = false
    setStopRequested(false)
    setIsRunning(true)
    setCurrentStep('output')

    const currentChapter =
      workflow.outlineChapters?.[workflow.currentChapterIndex] || ''

    const allDetails = Object.entries(workflow.detailSections || {})
      .filter(([, content]) => content && content.trim())
      .map(([chapter, content]) => `【${chapter}】\n${content}`)
      .join('\n\n')

    let prompt = `${systemPrompt}

知识点：${knowledge}`

    if (allDetails) {
      prompt = `${systemPrompt}

参考细纲：
${allDetails}

知识点：${knowledge}`
    } else if (workflow.detail) {
      prompt = `${systemPrompt}

参考细纲：
${workflow.detail}

知识点：${knowledge}`
    }

    const response = await generateContent(prompt)

    if (stopRequestedRef.current) {
      setIsRunning(false)
      return
    }

    if (response) {
      setRawOutput(response)
      setOutput(response)
      setShowPreview(true)
      updateOutput(response)

      if (currentChapter) {
        updateOutputSection(currentChapter, response)
      }
    }

    setIsRunning(false)
  }

  useEffect(() => {
    if (!autoSaveEnabled) return
    if (!knowledge.trim()) return

    const saveTimeout = setTimeout(() => {
      localStorage.setItem('lastKnowledge', knowledge)
    }, 500)

    return () => clearTimeout(saveTimeout)
  }, [knowledge, autoSaveEnabled])

  useEffect(() => {
    if (!autoSaveEnabled) return
    if (!output.trim()) return

    const saveTimeout = setTimeout(() => {
      localStorage.setItem('lastKnowledgeOutput', output)
      setShowSaved(true)

      const hideTimer = setTimeout(() => {
        setShowSaved(false)
      }, 2000)

      return () => clearTimeout(hideTimer)
    }, 500)

    return () => clearTimeout(saveTimeout)
  }, [output, autoSaveEnabled])

  const handleStop = () => {
    stopRequestedRef.current = true
    setStopRequested(true)
    clearAutoTimer()
    setIsRunning(false)
    setCurrentStep(null)
  }

  const handleCopy = async () => {
    const content = rawOutput || output
    if (!content.trim()) return

    await navigator.clipboard.writeText(content)
  }

  const handleDownload = () => {
    const content = rawOutput || output
    if (!content.trim()) return

    const blob = new Blob([content], {
      type: 'text/markdown;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = 'knowledge-output.md'
    a.click()

    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setOutput('')
    setRawOutput('')
    setHasGenerated(false)

    if (autoSaveEnabled) {
      localStorage.removeItem('lastKnowledgeOutput')
    }
  }

  const isGenerating = loading || isRunning

  return (
    <div className="knowledge-output-page">
      <div className={`main-content ${isGenerating ? 'grayed-out' : ''}`}>
        {isGenerating && (
          <div className="gray-overlay">
            <div className="loading-indicator">
              <Loader2 className="loader" size={24} />
              <span>
                {workflow.enabled && detailChapters.length > 0
                  ? `正在生成正文：${progressText}`
                  : '正在生成内容...'}
              </span>
            </div>
          </div>
        )}

        <div className="page-header">
          <h1 className="page-title">知识输出</h1>
          <p className="page-desc">
            生成完整、专业的知识内容，支持 Markdown 和 LaTeX 公式
          </p>
        </div>

        {workflow.enabled && detailChapters.length > 0 && (
          <div className="progress-section">
            <div className="progress-header">
              <span className="progress-label">生成进度</span>
              <span className="progress-text">{progressText}</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            {isGenerating &&
              currentDetailIndex > 0 &&
              currentDetailIndex <= detailChapters.length && (
                <div className="progress-chapter">
                  当前生成：{detailChapters[currentDetailIndex - 1]}
                </div>
              )}
          </div>
        )}

        <div className="input-section">
          <div className="input-group">
            <input
              type="text"
              className="input-field"
              placeholder="请输入知识点，例如：牛顿第二定律、氧化还原反应..."
              value={knowledge}
              onChange={(event) => setKnowledge(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !isGenerating) {
                  handleGenerate()
                }
              }}
            />

            {isGenerating ? (
              <button className="btn btn-danger generate-btn" onClick={handleStop}>
                <Square size={18} />
                停止
              </button>
            ) : workflow.enabled && detailChapters.length > 0 ? (
              <button
                className="btn btn-primary generate-btn"
                onClick={handleGenerateAll}
              >
                <Play size={18} />
                生成全部正文
              </button>
            ) : (
              <button
                className="btn btn-primary generate-btn"
                onClick={handleGenerate}
                disabled={!knowledge.trim()}
              >
                <Send size={18} />
                生成内容
              </button>
            )}
          </div>

          {workflow.enabled && (workflow.outline || workflow.detail) && (
            <div className="workflow-hint">
              <ArrowLeft size={14} />
              <span>工作流即将完成，这是最后一步</span>
            </div>
          )}

          {showSaved && (
            <div className="auto-save-indicator">
              <Check size={14} />
              <span>已自动保存</span>
            </div>
          )}

          {stopRequested && (
            <div className="workflow-hint">
              <Square size={14} />
              <span>已停止当前知识输出生成</span>
            </div>
          )}
        </div>

        <div className="system-prompt-section">
          <h3 className="section-title">系统指令</h3>
          <div className="prompt-content">
            <pre>{systemPrompt}</pre>
          </div>
        </div>

        {(output || rawOutput) && (
          <div className="output-section">
            <div className="section-header">
              <h3 className="section-title">生成的知识内容</h3>

              <div className="section-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPreview((prev) => !prev)}
                >
                  {showPreview ? <Code2 size={16} /> : <Eye size={16} />}
                  {showPreview ? '源码' : '预览'}
                </button>

                <button className="btn btn-secondary" onClick={handleCopy}>
                  <Copy size={16} />
                  复制
                </button>

                <button className="btn btn-secondary" onClick={handleDownload}>
                  <Download size={16} />
                  下载
                </button>

                <button className="btn btn-secondary" onClick={handleClear}>
                  <Trash2 size={16} />
                  清空
                </button>
              </div>
            </div>

            {showPreview ? (
              <div className="markdown-preview">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {rawOutput || output}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="output-content">
                <pre>{rawOutput || output}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default KnowledgeOutput
