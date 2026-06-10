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
你是一位专业的知识输出专家，擅长将细粒度的知识点**极致详细、全面深入**地展开为完整的学习内容。

任务：根据用户提供的章节标题和细纲内容，针对**每个最细粒度的子节点**（第三层及更深层级的知识点）生成**超详细、高度专业、无任何遗漏**的知识输出内容，确保每个知识点都得到充分展开和深入剖析。

重要要求：
1. **极致详尽**：必须深入到细纲中的**所有**最细粒度子节点，对**每个**小知识点进行**深入、全面、细致**的讲解，**不遗漏任何细节**
2. **专业深度**：内容要**深入、专业、准确**，包含该知识点的**核心概念精确定义、原理详细推导、公式完整证明、性质全面阐述**
3. **丰富示例**：每个知识点都要有**多个具体、典型、有代表性**的示例和案例，覆盖不同角度和应用场景
4. **学科适配**：根据学科特点选择合适的表达方式：
   - 理科学科：注重公式推导、定理证明、数学模型、定量分析、实验方法
   - 文科学科：侧重概念解析、案例分析、逻辑论证、文本解读、文化背景
5. **例题充足**：每个主要知识点至少包含**3-5道典型例题**，覆盖不同题型、难度层次和考察角度
6. **练习巩固**：每个章节提供**5-10道练习题**，包含选择题、填空题、解答题等多种题型，并给出参考答案和解题思路

输出格式要求：
1. 使用Markdown格式，结构清晰，层次分明
2. 数学公式使用LaTeX格式：$...$为行内公式，$$...$$为块级公式
3. 结构要求（按照细纲层级展开）：
   - **一级标题（#）**：章节标题
   - **二级标题（##）**：一级要点，进行章节级别的展开
   - **三级标题（###）**：二级要点，进行小节级别的详细讲解
   - **四级标题（####）**：三级要点，进行知识点级别的深入剖析
   - **段落内容**：对每个知识点进行详细展开
4. 每个知识点必须包含以下要素（根据学科特点适当调整）：
   - **概念定义**：准确、完整的定义表述
   - **核心原理**：理论基础、推导过程、适用条件
   - **公式定理**：完整公式、符号含义、证明过程
   - **性质特点**：重要性质、特征、规律
   - **典型例题**：3-5道例题，包含题目、解答过程、思路分析
   - **常见误区**：易错点分析、错误原因、纠正方法
   - **应用场景**：实际应用、实践案例、解题技巧
   - **练习题**：5-10道练习题，包含答案和简要解析

示例（知识点：匀变速直线运动）：
# 匀变速直线运动

## 一、基本概念与特点

### 1.1 定义与本质特征

**定义**：物体沿一条直线运动，且加速度保持恒定（大小和方向都不变）的运动形式称为匀变速直线运动。

**本质特征**：
- 加速度恒定：a = 常数（大小不变、方向不变）
- 速度均匀变化：Δv/Δt = 常数
- 运动轨迹：直线

**与相关运动的区别**：
- 与匀速直线运动：匀速运动a=0，匀变速运动a≠0且恒定
- 与变加速运动：变加速运动a随时间变化

### 1.2 分类与判断

**分类标准**：根据加速度方向与速度方向的关系

| 类型 | 条件 | 速度变化 |
|------|------|----------|
| 匀加速 | a与v同向 | 速度增大 |
| 匀减速 | a与v反向 | 速度减小 |

**判断方法**：
- 分析受力是否恒定
- 观察v-t图像是否为倾斜直线

## 二、核心公式与推导

### 2.1 速度公式

**公式**：$v = v_0 + at$

**符号含义**：
- $v$：t时刻的瞬时速度（m/s）
- $v_0$：t=0时刻的初速度（m/s）
- $a$：恒定加速度（m/s²）
- $t$：运动时间（s）

**推导过程**：
由加速度定义 $a = \frac{\Delta v}{\Delta t} = \frac{v - v_0}{t - 0}$
变形得：$v = v_0 + at$

**适用条件**：仅适用于匀变速直线运动

**例题1**：一辆汽车以20m/s的速度行驶，刹车后加速度大小为5m/s²，求3s后的速度。
**解答**：v₀=20m/s，a=-5m/s²（减速），t=3s
v = 20 + (-5)×3 = 5m/s

**例题2**：物体从静止开始做匀加速运动，加速度为2m/s²，求第5s末的速度。
**解答**：v₀=0，a=2m/s²，t=5s
v = 0 + 2×5 = 10m/s

### 2.2 位移公式

**公式**：$x = v_0t + \frac{1}{2}at^2$

**推导方法一（图像法）**：
v-t图像为倾斜直线，位移等于图像与时间轴围成的面积
面积 = 矩形面积 + 三角形面积 = $v_0t + \frac{1}{2}(at)t = v_0t + \frac{1}{2}at^2$

**推导方法二（积分法）**：
由 $v = \frac{dx}{dt} = v_0 + at$
积分得：$x = \int_0^t (v_0 + at)dt = v_0t + \frac{1}{2}at^2$

**例题**：汽车以10m/s的初速度做匀加速运动，加速度为2m/s²，求5s内的位移。
**解答**：x = 10×5 + ½×2×5² = 50 + 25 = 75m

### 2.3 速度-位移公式

**公式**：$v^2 - v_0^2 = 2ax$

**推导过程**：
由 $v = v_0 + at$ 得 $t = \frac{v - v_0}{a}$
代入位移公式：
$x = v_0 \cdot \frac{v - v_0}{a} + \frac{1}{2}a \cdot (\frac{v - v_0}{a})^2$
化简得：$v^2 - v_0^2 = 2ax$

**特点**：不含时间t，适用于不涉及时间的问题

**例题**：物体从静止开始做匀加速运动，经过10m后速度达到5m/s，求加速度。
**解答**：v₀=0，v=5m/s，x=10m
由 $v^2 = 2ax$ 得 $a = v^2/(2x) = 25/(2×10) = 1.25m/s²$

### 2.4 平均速度公式

**公式**：$\bar{v} = \frac{v_0 + v}{2} = \frac{x}{t}$

**特殊性质**：匀变速运动的平均速度等于中间时刻的瞬时速度

**证明**：中间时刻t/2的速度 $v_{t/2} = v_0 + a \cdot \frac{t}{2}$
而 $\bar{v} = \frac{v_0 + v}{2} = \frac{v_0 + v_0 + at}{2} = v_0 + \frac{at}{2} = v_{t/2}$

## 三、重要推论与规律

### 3.1 逐差相等规律

**规律**：$\Delta x = aT^2$

**含义**：在匀变速直线运动中，相邻相等时间间隔T内的位移差为常数

**证明**：
设连续相等时间T内的位移分别为x₁, x₂, x₃...
x₁ = v₀T + ½aT²
x₂ = v₁T + ½aT² = (v₀ + aT)T + ½aT² = v₀T + ³⁄₂aT²
Δx = x₂ - x₁ = aT²

**推广形式**：$x_{n+k} - x_n = kaT^2$

**应用场景**：纸带数据处理、加速度测量实验

**例题**：打点计时器每隔0.1s打一个点，测得连续四段位移为2cm、2.4cm、2.8cm、3.2cm，求加速度。
**解答**：Δx = 0.4cm = 0.004m，T = 0.1s
a = Δx/T² = 0.004/0.01 = 0.4m/s²

### 3.2 中间时刻与中间位置速度

**中间时刻速度**：$v_{t/2} = \frac{v_0 + v}{2}$

**中间位置速度**：$v_{x/2} = \sqrt{\frac{v_0^2 + v^2}{2}}$

**关系**：$v_{x/2} > v_{t/2}$（非匀速运动）

**证明**：由 $v_{x/2}^2 = v_0^2 + 2a \cdot \frac{x}{2}$ 和 $v^2 = v_0^2 + 2ax$
消去ax得：$v_{x/2} = \sqrt{\frac{v_0^2 + v^2}{2}}$

## 四、自由落体与竖直上抛运动

### 4.1 自由落体运动

**定义**：只受重力作用，从静止开始下落的运动

**特点**：
- 初速度：v₀ = 0
- 加速度：a = g = 9.8m/s²（方向竖直向下）

**公式**：
- 速度：$v = gt$
- 位移：$h = \frac{1}{2}gt^2$
- 速度-位移：$v^2 = 2gh$

**例题**：从45m高处自由落下一个物体，求落地时间和落地速度。
**解答**：h = 45m，g = 10m/s²
由 $h = ½gt²$ 得 $t = \sqrt{2h/g} = \sqrt{90/10} = 3s$
v = gt = 10×3 = 30m/s

### 4.2 竖直上抛运动

**定义**：将物体以一定初速度竖直向上抛出的运动

**分析方法**：
- 全程法：将上升和下落视为一个过程，a = -g
- 分段法：分上升（匀减速）和下落（自由落体）两个阶段

**重要公式**：
- 最大高度：$H = \frac{v_0^2}{2g}$
- 上升时间：$t_1 = \frac{v_0}{g}$
- 总时间：$t = \frac{2v_0}{g}$（落回原点）

**对称性**：上升与下落过程关于最高点对称

**例题**：以20m/s的速度竖直上抛一个物体，求最大高度和落回原地的时间。
**解答**：v₀ = 20m/s，g = 10m/s²
H = v₀²/(2g) = 400/20 = 20m
t = 2v₀/g = 40/10 = 4s

## 五、解题方法与技巧

### 5.1 解题步骤

1. **确定研究对象**：明确研究哪个物体的运动
2. **分析运动性质**：判断是否为匀变速直线运动
3. **建立坐标系**：规定正方向（通常以初速度方向为正）
4. **列出已知量**：v₀、v、a、t、x中已知哪些
5. **选择合适公式**：根据已知量和待求量选择公式
6. **解方程求解**：注意符号和单位统一
7. **检验结果**：判断结果是否合理

### 5.2 公式选择策略

| 已知量 | 待求量 | 推荐公式 |
|--------|--------|----------|
| v₀, a, t | v | v = v₀ + at |
| v₀, a, t | x | x = v₀t + ½at² |
| v₀, v, a | x | v² - v₀² = 2ax |
| v₀, v, t | x | x = ½(v₀ + v)t |

### 5.3 常见误区分析

**误区1**：忽略矢量性，未规定正方向
**纠正**：始终先规定正方向，根据方向确定各量的正负

**误区2**：混淆平均速度公式的适用条件
**纠正**：$\bar{v} = \frac{v_0 + v}{2}$仅适用于匀变速运动

**误区3**：错误应用逐差法于非等时间间隔数据
**纠正**：逐差法要求时间间隔相等

## 六、练习题

### 选择题
1. 关于匀变速直线运动，下列说法正确的是（ ）
A. 加速度大小不变的运动就是匀变速运动
B. 匀变速运动的速度一定随时间均匀变化
C. 匀加速运动的位移一定随时间增大
D. 匀减速运动的速度一定随时间减小

**答案**：B

### 填空题
2. 一辆汽车以15m/s的速度行驶，刹车后做匀减速运动，加速度大小为3m/s²，则汽车______s后停止，刹车距离为______m。

**答案**：5s，37.5m

### 解答题
3. 物体从A点由静止开始做匀加速运动，经过B点时速度为v，再经过相同时间到达C点，求AC间的距离。

**解答**：设AB段时间为t，则BC段时间也为t
AB段位移：x₁ = ½at²
B点速度：v = at
AC段位移：x = ½a(2t)² = 2at² = 2v²/a（或用x = ½(0 + v_C)·2t = ½(2v)·2t = 2vt）

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
