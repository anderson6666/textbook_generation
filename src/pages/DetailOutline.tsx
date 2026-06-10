import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, Square, Play, ArrowLeft } from 'lucide-react'
import { useAgnesAPI } from '../hooks/useAgnesAPI'
import { useWorkflow } from '../context/WorkflowContext'
import { useNavigate } from 'react-router-dom'

const systemPrompt = `
你是一位专业的知识拆解专家，擅长将复杂的知识点**完整、系统地**分解为易于理解的细分要点。

任务：根据用户提供的章节标题，生成**完整、无遗漏**的细纲分点内容，确保覆盖该章节的所有核心知识点。

重要要求：
1. **完整性原则**：必须全面覆盖该章节的所有核心知识点，确保不遗漏任何重要内容
2. **具体性原则**：必须根据具体章节内容生成具体的知识点，不要使用通用模板
3. **专业性原则**：每个要点都要有具体的专业术语、概念或方法名称，内容要深入、专业，体现该领域的核心知识
4. **深度原则**：知识是复杂的，每个章节应包含5-10个主要知识点，每个主要知识点下应有2-5个子要点，子要点下还可以有更细的说明或示例
5. **逻辑连贯性**：知识点之间要有清晰的逻辑顺序，从基础概念到深入应用

输出格式要求：
1. 使用Markdown列表格式（- 一级要点，缩进表示子要点）
2. 分解层级至少3-4级，复杂知识点可达5级，确保知识拆解的深度
3. 每个要点应包含：
   - 核心概念/术语的定义
   - 关键公式或方法（如有）
   - 重要性质或特点
   - 典型示例或应用场景
   - 常见误区或注意事项（如有）

示例（章节：匀变速直线运动）：
- 匀变速直线运动的基本概念
  - 定义：沿直线运动且加速度恒定的运动
    - 加速度恒定的含义：大小和方向都不变
    - 与匀速直线运动的区别：速度是否变化
  - 特点：速度均匀变化
    - 速度变化率恒定：Δv/Δt = a（常数）
    - 相等时间内速度变化量相等
  - 分类
    - 匀加速运动：a > 0，速度增大
    - 匀减速运动：a < 0，速度减小
- 速度与时间的关系
  - 速度公式：v = v₀ + at
    - v：末速度（m/s）
    - v₀：初速度（m/s）
    - a：加速度（m/s²）
    - t：时间（s）
    - 适用条件：匀变速直线运动
  - v-t图像
    - 图像为倾斜直线
    - 斜率表示加速度：k = a
    - 纵截距表示初速度：b = v₀
    - 图像面积表示位移
- 位移与时间的关系
  - 位移公式：x = v₀t + ½at²
    - 公式推导方法：利用v-t图像面积
    - 各项物理意义
  - 平均速度公式：x = ½(v₀+v)t
    - 只适用于匀变速运动
    - 平均速度等于中间时刻速度
- 重要推论
  - 速度-位移关系：v² - v₀² = 2ax
    - 不含时间t的运动学公式
    - 适用于不涉及时间的问题
  - 逐差相等：Δx = aT²
    - 相邻相等时间间隔内位移之差相等
    - 常用于纸带数据处理

请直接输出细纲内容，不要添加任何开场白或解释。
`

function DetailOutline() {
  const [chapter, setChapter] = useState('')
  const [detail, setDetail] = useState('')
  const { loading, generateContent } = useAgnesAPI()

  const {
    workflow,
    updateDetail,
    setCurrentStep,
    setCurrentChapterIndex,
    setIsRunning,
  } = useWorkflow()
  const isRunning = workflow.isRunning

  const navigate = useNavigate()

  const [stopRequested, setStopRequested] = useState(false)
  const stopRequestedRef = useRef(false)
  const autoNavigateRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAutoNavigate = () => {
    if (autoNavigateRef.current) {
      clearTimeout(autoNavigateRef.current)
      autoNavigateRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearAutoNavigate()
    }
  }, [])

  useEffect(() => {
    const handleNavigate = () => {
      clearAutoNavigate()
    }

    window.addEventListener('popstate', handleNavigate)

    return () => {
      window.removeEventListener('popstate', handleNavigate)
    }
  }, [])

  // 自动填充当前要处理的小节
  useEffect(() => {
    if (
      workflow.enabled &&
      workflow.outlineChapters.length > 0 &&
      workflow.currentChapterIndex < workflow.outlineChapters.length
    ) {
      const currentChapter =
        workflow.outlineChapters[workflow.currentChapterIndex]

      if (currentChapter && currentChapter !== chapter) {
        setDetail('')
        setChapter(currentChapter)

        if (workflow.currentStep !== 'detail') {
          setCurrentStep('detail')
        }
      }
    }
  }, [
    workflow.enabled,
    workflow.outlineChapters,
    workflow.currentChapterIndex,
    workflow.currentStep,
    chapter,
    setCurrentStep,
  ])

  const handleGenerate = async () => {
    if (!chapter.trim()) return

    clearAutoNavigate()

    stopRequestedRef.current = false
    setStopRequested(false)

    setIsRunning(true)
    setCurrentStep('detail')

    let prompt = `${systemPrompt}\n\n章节标题：${chapter}`

    if (workflow.outline) {
      prompt = `${systemPrompt}\n\n参考大纲：\n${workflow.outline}\n\n章节标题：${chapter}`
    }

    const response = await generateContent(prompt)

    if (stopRequestedRef.current) {
      setIsRunning(false)
      return
    }

    if (response) {
      updateDetail(chapter, response)
      setDetail(response)

      if (workflow.enabled) {
        const nextIndex = workflow.currentChapterIndex + 1

        if (nextIndex < workflow.outlineChapters.length) {
          autoNavigateRef.current = setTimeout(() => {
            if (stopRequestedRef.current) return

            setCurrentChapterIndex(nextIndex)
            setDetail('')
            setChapter(workflow.outlineChapters[nextIndex])
          }, 1000)
        } else {
          autoNavigateRef.current = setTimeout(() => {
            if (stopRequestedRef.current) return

            // 关键修复：细纲全部完成后，切换到 output 步骤
            setCurrentStep('output')
            navigate('/knowledge-output')
          }, 1000)
        }
      }
    }

    setIsRunning(false)
  }

  // 工作流模式下自动开始生成
  useEffect(() => {
    const currentChapterContent = workflow.detailSections?.[chapter]

    if (
      workflow.enabled &&
      chapter &&
      !currentChapterContent &&
      !detail &&
      !loading &&
      !isRunning &&
      workflow.currentStep === 'detail'
    ) {
      const timer = setTimeout(() => {
        if (!stopRequestedRef.current && !loading && !isRunning) {
          handleGenerate()
        }
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [
    workflow.enabled,
    workflow.currentStep,
    workflow.detailSections,
    chapter,
    detail,
    loading,
    isRunning,
  ])

  // 自动跳过已有细纲的章节
  useEffect(() => {
    if (workflow.enabled && chapter && workflow.currentStep === 'detail') {
      const currentChapterContent = workflow.detailSections?.[chapter]

      if (currentChapterContent && !detail && !loading && !isRunning) {
        const nextIndex = workflow.currentChapterIndex + 1

        if (nextIndex < workflow.outlineChapters.length) {
          const timer = setTimeout(() => {
            setCurrentChapterIndex(nextIndex)
          }, 300)

          return () => clearTimeout(timer)
        }

        const timer = setTimeout(() => {
          // 关键修复：已有细纲全部跳过完成后，切换到 output 步骤
          setCurrentStep('output')
          navigate('/knowledge-output')
        }, 300)

        return () => clearTimeout(timer)
      }
    }
  }, [
    workflow.enabled,
    workflow.currentStep,
    workflow.currentChapterIndex,
    workflow.outlineChapters.length,
    workflow.detailSections,
    chapter,
    detail,
    loading,
    isRunning,
    setCurrentChapterIndex,
    setCurrentStep,
    navigate,
  ])

  const handleStop = () => {
    stopRequestedRef.current = true
    setStopRequested(true)
    clearAutoNavigate()
    setIsRunning(false)
    setCurrentStep(null)
  }

  const validChapters = workflow.outlineChapters.filter(
    (item) => item && item.trim(),
  )

  const progress =
    validChapters.length > 0
      ? `${workflow.currentChapterIndex + 1} / ${validChapters.length}`
      : ''

  return (
    <div className="detail-outline-page">
      <div className="page-header">
        <h1 className="page-title">细纲分点</h1>
        <p className="page-desc">深入拆解每个章节的具体知识点</p>
      </div>

      <div className="input-section">
        {workflow.enabled && validChapters.length > 0 && (
          <div className="workflow-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    ((workflow.currentChapterIndex + 1) /
                      validChapters.length) *
                    100
                  }%`,
                }}
              />
            </div>
            <span className="progress-text">
              正在处理: {progress} - {chapter}
            </span>
          </div>
        )}

        <div className="input-group">
          <input
            type="text"
            className="input-field"
            placeholder="请输入章节标题，例如：匀变速直线运动、牛顿运动定律..."
            value={chapter}
            onChange={(event) => setChapter(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !loading && !isRunning) {
                handleGenerate()
              }
            }}
          />

          {loading || isRunning ? (
            <button
              className="btn btn-danger generate-btn"
              onClick={handleStop}
            >
              <Square size={18} />
              停止
            </button>
          ) : (
            <button
              className="btn btn-primary generate-btn"
              onClick={handleGenerate}
              disabled={!chapter.trim()}
            >
              {workflow.enabled ? <Play size={18} /> : <Send size={18} />}
              {workflow.enabled ? '继续工作流' : '生成分点'}
            </button>
          )}
        </div>

        {workflow.enabled && workflow.outline && (
          <div className="workflow-hint">
            <ArrowLeft size={14} />
            <span>
              {workflow.outlineChapters.length > 0
                ? `工作流模式：将逐一处理 ${workflow.outlineChapters.length} 个小节`
                : '工作流已启用，将自动跳转到下一步'}
            </span>
          </div>
        )}
      </div>

      <div className="system-prompt-section">
        <h3 className="section-title">系统指令</h3>
        <div className="prompt-content">
          <pre>{systemPrompt}</pre>
        </div>
      </div>

      {detail && (
        <div className="detail-section">
          <div className="section-header">
            <h3 className="section-title">生成的细纲</h3>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDetail('')
              }}
            >
              <Trash2 size={16} />
              清空
            </button>
          </div>

          <div className="detail-content">
            <pre>{detail}</pre>
          </div>
        </div>
      )}

      {stopRequested && (
        <div className="workflow-hint">
          <Square size={14} />
          <span>已停止当前细纲生成</span>
        </div>
      )}
    </div>
  )
}

export default DetailOutline
