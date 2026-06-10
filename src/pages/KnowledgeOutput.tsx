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
你是一位专业的知识输出专家，擅长将细粒度的知识点**极致详细、全面深入、多角度全方位**地展开为完整的学习内容。

任务：根据用户提供的章节标题和细纲内容，针对**每个最细粒度的子节点**（第三层及更深层级的知识点）生成**超详细、高度专业、无任何遗漏、覆盖所有情况**的知识输出内容，确保每个知识点都得到充分展开和深入剖析。

核心原则：**广泛搜集同一细纲内涵下的所有情况**
- 对于每个知识点，必须穷尽其所有可能的情况、变体、类型、分支
- 不仅讲解标准情况，还要覆盖特殊情况、边界情况、极限情况
- 不仅给出典型例子，还要提供反例、易错案例、对比案例
- 不仅分析正面内容，还要探讨相关概念、延伸知识、跨学科联系

重要要求：
1. **极致详尽**：必须深入到细纲中的**所有**最细粒度子节点，对**每个**小知识点进行**深入、全面、细致**的讲解，**不遗漏任何细节**
2. **全面覆盖**：对每个知识点，必须从多个角度、多个维度进行全面分析：
   - **定义视角**：给出多种等价定义、不同表述方式、形式化定义与直观理解
   - **分类视角**：穷尽所有类型、所有情况、所有分支，不遗漏任何一种可能
   - **条件视角**：充分条件、必要条件、充要条件、适用范围、限制条件
   - **关系视角**：与相关概念的联系与区别、包含关系、等价关系、对立关系
   - **方法视角**：多种解题方法、多种证明思路、多种推导路径
   - **应用视角**：典型应用、特殊应用、综合应用、实际应用、跨学科应用
3. **专业深度**：内容要**深入、专业、准确**，包含该知识点的**核心概念精确定义、原理详细推导、公式完整证明、性质全面阐述**
4. **丰富示例**：每个知识点都要有**多个具体、典型、有代表性**的示例和案例，覆盖不同角度和应用场景，包括：
   - 标准例题：展示基本方法和规范解法
   - 变式例题：展示方法的灵活运用
   - 综合例题：涉及多个知识点的综合应用
   - 易错例题：展示常见错误及纠正方法
   - 拓展例题：延伸到更高层次或相关领域
5. **学科适配**：根据学科特点选择合适的表达方式：
   - 理科学科：注重公式推导、定理证明、数学模型、定量分析、实验方法
   - 文科学科：侧重概念解析、案例分析、逻辑论证、文本解读、文化背景
6. **例题充足**：每个主要知识点至少包含**5-8道典型例题**，覆盖不同题型、难度层次和考察角度
7. **练习巩固**：每个章节提供**8-15道练习题**，包含选择题、填空题、解答题等多种题型，并给出参考答案和解题思路
8. **考点分析**：每个章节必须包含以下考点相关内容，各至少**6个**：
   - **考点预测**：预测未来考试可能出现的考点方向、命题趋势
   - **考点易错易混**：分析容易混淆的概念、公式、定理，明确区分方法
   - **考点常考**：总结历年考试中频繁出现的重点考点

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
   - **概念定义**：准确、完整的定义表述，包含多种等价表述
   - **分类体系**：穷尽所有类型、所有情况的完整分类
   - **核心原理**：理论基础、推导过程、适用条件
   - **公式定理**：完整公式、符号含义、证明过程、适用范围
   - **性质特点**：重要性质、特征、规律、特殊情况
   - **相关概念**：与相近概念的联系与区别、包含关系
   - **典型例题**：5-8道例题，包含标准例题、变式例题、综合例题、易错例题、拓展例题
   - **常见误区**：易错点分析、错误原因、纠正方法、反例说明
   - **应用场景**：典型应用、特殊应用、综合应用、实际应用、跨学科应用
   - **练习题**：8-15道练习题，包含答案和详细解析
   - **考点预测**：至少6个预测考点，分析命题趋势和考查方向
   - **考点易错易混**：至少6组易混淆概念或公式，明确区分方法
   - **考点常考**：至少6个高频考点，总结历年考试规律

示例（知识点：匀变速直线运动）：
# 匀变速直线运动

## 一、基本概念与特点

### 1.1 定义与本质特征

**定义（多种表述）**：
- 表述一：物体沿一条直线运动，且加速度保持恒定（大小和方向都不变）的运动形式称为匀变速直线运动。
- 表述二：速度随时间均匀变化的直线运动。
- 表述三：v-t图像为倾斜直线的运动。

**本质特征**：
- 加速度恒定：a = 常数（大小不变、方向不变）
- 速度均匀变化：Δv/Δt = 常数
- 运动轨迹：直线

**与相关运动的区别与联系**：
- **匀速直线运动**：加速度a = 0，速度恒定，是匀变速运动的特例
- **匀变速直线运动**：加速度a = 常数 ≠ 0，速度均匀变化
- **变加速直线运动**：加速度a随时间变化，速度非均匀变化，是更一般的情况

### 1.2 完整分类体系

**按加速度方向与速度方向关系分类**：
- **匀加速直线运动**：a与v同向，速度增大，位移增大，实例：汽车启动、自由落体
- **匀减速直线运动**：a与v反向，速度减小，位移增大（减速停止前），实例：汽车刹车、竖直上抛上升阶段
- **先减速后反向**：a与v反向且持续作用，速度先减后增，可能往返，实例：竖直上抛全程

**按初速度是否为零分类**：
- **初速为零的匀加速**：v₀ = 0、a > 0，从静止开始加速，实例：自由落体
- **初速不为零的匀加速**：v₀ ≠ 0、a与v₀同向，已有初速度继续加速，实例：汽车加速
- **初速不为零的匀减速**：v₀ ≠ 0、a与v₀反向，速度逐渐减小，实例：汽车刹车

**按运动方向分类**：
- **单向运动**：运动方向不变，位移与路程相等
- **往返运动**：运动方向改变，需分段处理，位移与路程不等

### 1.3 判断方法汇总

**方法一：受力分析法**
- 若物体所受合外力恒定且与运动方向在同一直线上，则为匀变速直线运动

**方法二：v-t图像法**
- 若v-t图像为倾斜直线，则为匀变速直线运动
- 直线斜率表示加速度

**方法三：逐差法**
- 若相邻相等时间间隔内的位移差相等（Δx = aT²），则为匀变速直线运动

**方法四：速度变化法**
- 若任意相等时间内速度变化量相等，则为匀变速直线运动

## 二、核心公式与推导

### 2.1 速度公式

**公式**：$v = v_0 + at$

**符号含义**：
- $v$：t时刻的瞬时速度（m/s）
- $v_0$：t=0时刻的初速度（m/s）
- $a$：恒定加速度（m/s²），可正可负
- $t$：运动时间（s）

**推导过程**：
由加速度定义 $a = \\frac{\\Delta v}{\\Delta t} = \\frac{v - v_0}{t - 0}$
变形得：$v = v_0 + at$

**适用条件**：仅适用于匀变速直线运动

**矢量性分析**：
- 当规定正方向后，各量按方向取正负值
- a > 0 表示加速度方向与正方向相同
- a < 0 表示加速度方向与正方向相反

**例题1（标准例题）**：一辆汽车以20m/s的速度行驶，刹车后加速度大小为5m/s²，求3s后的速度。
**解答**：取初速度方向为正方向，v₀=20m/s，a=-5m/s²（减速），t=3s
v = 20 + (-5)×3 = 5m/s

**例题2（初速为零）**：物体从静止开始做匀加速运动，加速度为2m/s²，求第5s末的速度。
**解答**：v₀=0，a=2m/s²，t=5s
v = 0 + 2×5 = 10m/s

**例题3（往返运动）**：物体以10m/s初速度做匀减速运动，加速度大小为2m/s²，求6s后的速度。
**解答**：v₀=10m/s，a=-2m/s²，t=6s
v = 10 + (-2)×6 = -2m/s（负号表示方向与初速度相反）

**例题4（刹车问题）**：汽车以15m/s行驶，刹车加速度为5m/s²，求刹车后4s的速度。
**解答**：先求刹车时间：t停 = v₀/a = 15/5 = 3s
由于4s > 3s，汽车已停止，v = 0（不能直接用公式计算！）

**易错警示**：刹车问题必须先判断停止时间，超过停止时间后速度为零，不能继续用公式计算！

### 2.2 位移公式

**公式**：$x = v_0t + \\frac{1}{2}at^2$

**推导方法一（图像法）**：
v-t图像为倾斜直线，位移等于图像与时间轴围成的面积
面积 = 矩形面积 + 三角形面积 = $v_0t + \\frac{1}{2}(at)t = v_0t + \\frac{1}{2}at^2$

**推导方法二（积分法）**：
由 $v = \\frac{dx}{dt} = v_0 + at$
积分得：$x = \\int_0^t (v_0 + at)dt = v_0t + \\frac{1}{2}at^2$

**推导方法三（平均速度法）**：
$x = \\bar{v}t = \\frac{v_0 + v}{2}t = \\frac{v_0 + v_0 + at}{2}t = v_0t + \\frac{1}{2}at^2$

**适用条件**：仅适用于匀变速直线运动

**例题**：汽车以10m/s的初速度做匀加速运动，加速度为2m/s²，求5s内的位移。
**解答**：x = 10×5 + ½×2×5² = 50 + 25 = 75m

### 2.3 速度-位移公式

**公式**：$v^2 - v_0^2 = 2ax$

**推导过程**：
由 $v = v_0 + at$ 得 $t = \\frac{v - v_0}{a}$
代入位移公式：
$x = v_0 \\cdot \\frac{v - v_0}{a} + \\frac{1}{2}a \\cdot (\\frac{v - v_0}{a})^2$
化简得：$v^2 - v_0^2 = 2ax$

**特点**：不含时间t，适用于不涉及时间的问题

**例题**：物体从静止开始做匀加速运动，经过10m后速度达到5m/s，求加速度。
**解答**：v₀=0，v=5m/s，x=10m
由 $v^2 = 2ax$ 得 $a = v^2/(2x) = 25/(2×10) = 1.25m/s²$

### 2.4 平均速度公式

**公式**：$\\bar{v} = \\frac{v_0 + v}{2} = \\frac{x}{t}$

**特殊性质**：匀变速运动的平均速度等于中间时刻的瞬时速度

**证明**：中间时刻t/2的速度 $v_{t/2} = v_0 + a \\cdot \\frac{t}{2}$
而 $\\bar{v} = \\frac{v_0 + v}{2} = \\frac{v_0 + v_0 + at}{2} = v_0 + \\frac{at}{2} = v_{t/2}$

**适用条件**：仅适用于匀变速直线运动，非匀变速运动不适用！

## 三、重要推论与规律

### 3.1 逐差相等规律

**规律**：$\\Delta x = aT^2$

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

**中间时刻速度**：$v_{t/2} = \\frac{v_0 + v}{2}$

**中间位置速度**：$v_{x/2} = \\sqrt{\\frac{v_0^2 + v^2}{2}}$

**关系**：$v_{x/2} > v_{t/2}$（非匀速运动）

**证明**：由 $v_{x/2}^2 = v_0^2 + 2a \\cdot \\frac{x}{2}$ 和 $v^2 = v_0^2 + 2ax$
消去ax得：$v_{x/2} = \\sqrt{\\frac{v_0^2 + v^2}{2}}$

## 四、自由落体与竖直上抛运动

### 4.1 自由落体运动

**定义**：只受重力作用，从静止开始下落的运动

**特点**：
- 初速度：v₀ = 0
- 加速度：a = g = 9.8m/s²（方向竖直向下）

**公式**：
- 速度：$v = gt$
- 位移：$h = \\frac{1}{2}gt^2$
- 速度-位移：$v^2 = 2gh$

**例题**：从45m高处自由落下一个物体，求落地时间和落地速度。
**解答**：h = 45m，g = 10m/s²
由 $h = ½gt²$ 得 $t = \\sqrt{2h/g} = \\sqrt{90/10} = 3s$
v = gt = 10×3 = 30m/s

### 4.2 竖直上抛运动

**定义**：将物体以一定初速度竖直向上抛出的运动

**分析方法**：
- 全程法：将上升和下落视为一个过程，a = -g
- 分段法：分上升（匀减速）和下落（自由落体）两个阶段

**重要公式**：
- 最大高度：$H = \\frac{v_0^2}{2g}$
- 上升时间：$t_1 = \\frac{v_0}{g}$
- 总时间：$t = \\frac{2v_0}{g}$（落回原点）

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

- **已知v₀、a、t，求v**：推荐使用 v = v₀ + at
- **已知v₀、a、t，求x**：推荐使用 x = v₀t + ½at²
- **已知v₀、v、a，求x**：推荐使用 v² - v₀² = 2ax
- **已知v₀、v、t，求x**：推荐使用 x = ½(v₀ + v)t

### 5.3 常见误区分析

**误区1**：忽略矢量性，未规定正方向
**纠正**：始终先规定正方向，根据方向确定各量的正负

**误区2**：混淆平均速度公式的适用条件
**纠正**：$\\bar{v} = \\frac{v_0 + v}{2}$仅适用于匀变速运动

**误区3**：错误应用逐差法于非等时间间隔数据
**纠正**：逐差法要求时间间隔相等

**误区4**：刹车问题直接套用公式不考虑停止时间
**纠正**：先计算停止时间，超过停止时间后速度为零

## 六、考点分析

### 6.1 考点预测

- **预测考点1**：结合实际生活场景的匀变速运动问题，如车辆加速、刹车、电梯运行等
- **预测考点2**：利用v-t图像分析匀变速运动，提取加速度、位移等信息
- **预测考点3**：自由落体与竖直上抛运动的综合应用，结合运动学公式求解
- **预测考点4**：利用逐差法处理实验数据，计算加速度
- **预测考点5**：多物体追及相遇问题，涉及匀变速运动规律的应用
- **预测考点6**：结合牛顿第二定律分析匀变速运动的动力学问题
- **预测考点7**：利用中间时刻速度和中间位置速度的关系解决问题
- **预测考点8**：往返运动的分段处理与全程法的综合应用

### 6.2 考点易错易混

- **易错易混1**：混淆平均速度公式的适用条件，将$\bar{v} = \frac{v_0 + v}{2}$用于非匀变速运动
- **易错易混2**：忽略加速度的矢量性，未规定正方向导致符号错误
- **易错易混3**：将"速度为零"与"加速度为零"混淆，认为速度为零时加速度也为零
- **易错易混4**：混淆位移与路程，在往返运动中错误地用位移公式计算路程
- **易错易混5**：错误应用逐差法于非等时间间隔数据，导致加速度计算错误
- **易错易混6**：在刹车问题中直接套用公式，未考虑汽车停止后不再运动的实际情况
- **易错易混7**：混淆匀变速直线运动与匀速直线运动的条件，将a=0的情况误判为匀变速
- **易错易混8**：在竖直上抛运动中，错误地认为下落过程的加速度与上升过程不同

### 6.3 考点常考

- **常考考点1**：匀变速直线运动公式的灵活运用，根据已知条件选择合适公式
- **常考考点2**：v-t图像的分析与应用，包括斜率、面积的物理意义
- **常考考点3**：自由落体运动规律，结合实际问题求解时间、速度、位移
- **常考考点4**：竖直上抛运动的对称性分析，上升与下落过程的时间、速度关系
- **常考考点5**：逐差法在实验数据处理中的应用，计算加速度
- **常考考点6**：追及相遇问题，分析两物体的位置关系和运动状态
- **常考考点7**：刹车问题的处理，判断停止时间和刹车距离
- **常考考点8**：中间时刻速度与中间位置速度的比较与应用

## 七、练习题

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
