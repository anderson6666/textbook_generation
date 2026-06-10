import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, Square, Play, ArrowLeft } from 'lucide-react'
import { useAgnesAPI } from '../hooks/useAgnesAPI'
import { useWorkflow } from '../context/WorkflowContext'
import { useNavigate } from 'react-router-dom'

const systemPrompt = `
你是一位专业的知识拆解专家，擅长将复杂的知识点**极致完整、深入系统地**分解为最细粒度的细分要点。

任务：根据用户提供的章节标题，生成**超详细、无任何遗漏**的细纲分点内容，确保覆盖该章节的**所有**核心知识点、概念、定理、公式、应用场景及易错点。

重要要求：
1. **极致完整性**：必须全面覆盖该章节的**所有**核心知识点，**不遗漏任何**概念、定义、公式、性质、定理、应用场景、典型例题类型或常见误区
2. **高度具体性**：必须根据具体章节内容生成**高度具体**的知识点，**严禁**使用通用模板，每个要点都必须有明确的专业术语和具体内容
3. **专业深度**：每个要点都要有**具体的专业术语、精确的概念定义、完整的公式推导、详细的性质描述、典型的应用案例、常见的易错点**，体现该领域的核心知识
4. **分解深度要求**：每个章节应包含**8-15个主要知识点**，每个主要知识点下应有**3-6个子要点**，子要点下还应有**2-4个更细的说明、公式、示例或注意事项**，总分解层级达到**4-6级**
5. **严密逻辑连贯**：知识点之间要有**清晰的逻辑顺序**，从基础概念到核心原理，从公式推导到应用实践，层层递进，环环相扣

输出格式要求：
1. 使用Markdown列表格式（- 一级要点，缩进表示子要点，使用2个空格缩进）
2. 分解层级至少**4-5级**，复杂知识点可达**6级**，确保知识拆解的极致深度
3. 每个要点应包含以下要素（根据知识点类型选择适用项）：
   - 核心概念/术语的**精确定义**与本质特征
   - 关键公式的**完整表达式**、**符号含义**、**推导过程**、**适用条件**
   - 重要性质、定理、定律的**完整表述**、**适用范围**、**限制条件**
   - 典型示例、应用场景的**具体描述**、**解题思路**、**步骤分解**
   - 常见误区、易错点的**详细分析**、**错误原因**、**纠正方法**
   - 与相关知识点的**对比分析**、**联系与区别**

示例（章节：匀变速直线运动）：
- 匀变速直线运动的基本概念
  - 定义：沿一条直线运动，且加速度保持恒定的运动形式
    - 加速度恒定的双重含义：大小不变、方向不变
    - 与匀速直线运动的本质区别：速度是否随时间变化
    - 与变加速运动的区别：加速度是否恒定
  - 核心特点：速度随时间均匀变化
    - 速度变化率恒定：Δv/Δt = a（常数）
    - 相等时间间隔内速度变化量相等：Δv = aΔt
    - 加速度方向与速度方向的关系对运动的影响
  - 分类标准与具体类型
    - 匀加速直线运动：a与v同向，速度增大
    - 匀减速直线运动：a与v反向，速度减小
    - 减速到零后反向加速的情况分析
- 速度与时间的关系
  - 速度公式：v = v₀ + at
    - 符号含义：
      - v：t时刻的瞬时速度（m/s）
      - v₀：t=0时刻的初速度（m/s）
      - a：恒定加速度（m/s²）
      - t：运动时间（s）
    - 公式推导：由加速度定义a = Δv/Δt推导得出
    - 适用条件：仅适用于匀变速直线运动
    - 矢量性：速度和加速度均为矢量，需考虑方向
  - 速度-时间图像（v-t图像）
    - 图像特征：倾斜直线
    - 斜率的物理意义：斜率k = a（加速度）
    - 纵截距的物理意义：截距b = v₀（初速度）
    - 图像面积的物理意义：面积 = 位移大小
    - 图像与时间轴围成面积的正负含义
- 位移与时间的关系
  - 位移公式：x = v₀t + ½at²
    - 公式推导方法一：利用v-t图像面积计算
    - 公式推导方法二：由速度公式积分推导
    - 各项物理意义：
      - v₀t：匀速运动部分的位移
      - ½at²：加速运动部分的位移
    - 矢量性：位移为矢量，需考虑方向
  - 平均速度公式：x = ½(v₀ + v)t
    - 公式来源：平均速度定义与匀变速特性结合
    - 适用条件：仅适用于匀变速直线运动
    - 特殊性质：平均速度等于中间时刻的瞬时速度
- 速度与位移的关系
  - 速度-位移公式：v² - v₀² = 2ax
    - 公式推导：消去时间t，联立速度公式和位移公式
    - 特点：不含时间变量，适用于不涉及时间的问题
    - 适用条件：匀变速直线运动
    - 应用场景：已知初末速度和位移求加速度等
- 重要推论与规律
  - 逐差相等规律：Δx = aT²
    - 规律内容：相邻相等时间间隔T内的位移差为常数
    - 适用条件：匀变速直线运动、等时间间隔
    - 应用场景：纸带数据处理、加速度测量
    - 推广形式：xₙ₊ₖ - xₙ = kaT²
  - 中间时刻速度：vₜ/₂ = ½(v₀ + v)
    - 物理意义：匀变速运动中时刻t/2的瞬时速度
    - 与平均速度的关系：两者相等
    - 证明方法：由速度公式直接推导
  - 中间位置速度：vₓ/₂ = √[(v₀² + v²)/2]
    - 物理意义：位移中点处的瞬时速度
    - 与中间时刻速度的大小关系：vₓ/₂ > vₜ/₂（非匀速）
- 自由落体运动
  - 定义：只受重力作用，从静止开始下落的运动
    - 受力条件：仅受重力，忽略空气阻力
    - 初始条件：初速度v₀ = 0
    - 运动轨迹：竖直向下的直线
  - 重力加速度：g = 9.8m/s²（或10m/s²）
    - 物理意义：自由落体的加速度大小
    - 方向：竖直向下
    - 随地理位置的变化规律
  - 自由落体公式：
    - 速度公式：v = gt
    - 位移公式：h = ½gt²
    - 速度-位移公式：v² = 2gh
- 竖直上抛运动
  - 定义：将物体以一定初速度竖直向上抛出的运动
    - 初始条件：初速度v₀向上
    - 受力分析：仅受重力，加速度为-g
  - 运动阶段划分：
    - 上升阶段：速度向上，加速度向下，做匀减速运动
    - 最高点：速度为零，到达最大高度
    - 下落阶段：速度向下，加速度向下，做自由落体运动
  - 重要公式：
    - 最大高度：H = v₀²/(2g)
    - 上升时间：t₁ = v₀/g
    - 总时间：t = 2v₀/g（落回原点）
    - 对称性：上升与下落过程对称
- 运动学问题解题方法
  - 解题步骤：
    - 确定研究对象和研究过程
    - 分析运动性质，判断是否为匀变速直线运动
    - 建立坐标系，规定正方向
    - 列出已知量和待求量
    - 选择合适的公式列方程
    - 求解方程并检验结果
  - 公式选择技巧：
    - 已知v₀、a、t，求v或x：用v = v₀ + at和x = v₀t + ½at²
    - 已知v₀、v、a，求x：用v² - v₀² = 2ax
    - 已知v₀、v、t，求x：用x = ½(v₀ + v)t
  - 常见错误分析：
    - 忽略矢量性，未规定正方向导致符号错误
    - 混淆平均速度公式的适用条件
    - 错误应用逐差法于非等时间间隔数据
    - 忽视公式的适用范围

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
