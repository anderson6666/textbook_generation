import { useState, useEffect, useRef } from 'react'
import { Send, ChevronDown, ChevronRight, BookOpen, Trash2, Square, Play } from 'lucide-react'
import { useAgnesAPI } from '../hooks/useAgnesAPI'
import { useWorkflow } from '../context/WorkflowContext'
import { useNavigate } from 'react-router-dom'

interface OutlineNode {
  id: string
  title: string
  children?: OutlineNode[]
}

const systemPrompt = `
你是一位专业的教科书编辑专家，擅长为终身学习者创建**超详细、无遗漏**的知识大纲。

任务：根据用户提供的学习主题，生成一个**极其完整、系统深入、无任何遗漏**的教科书大纲目录，确保覆盖该主题的全部核心知识领域及所有重要细节。

重要要求：
1. **极致完整性**：必须全面覆盖该学科/主题的**所有**核心知识领域，**不遗漏任何**重要知识点、概念、定理、公式或应用场景
2. **高度具体性**：必须根据具体主题生成**高度具体**的章节标题，**严禁**使用通用模板标题，每个标题都必须准确反映该部分的具体内容
3. **专业深度**：章节标题必须反映主题的**具体知识领域**和**核心内容**，每个章节和子章节都要有**具体、专业、精准**的内容描述
4. **足够深度与广度**：知识是复杂的，每个主题应包含**不少于8-12章**，每章**不少于6-10节**，每节**不少于4-8小节**，确保知识框架的深度和广度
5. **严密逻辑连贯**：章节之间要有**清晰的逻辑顺序**，从基础到进阶，从理论到实践，从宏观到微观，层层递进
6. **知识颗粒度细化**：小节作为知识的最小单元，必须**足够细化**，确保每个知识点都能独立展开为详细内容

输出格式要求：
1. 使用Markdown标题格式（# 一级标题，## 二级标题，### 三级标题）
2. 结构层次：章 -> 节 -> 小节（三级结构）
3. **最低数量要求**：
   - 总章节数：不少于8章
   - 每章节数：不少于6节
   - 每节节数：不少于4小节

示例（主题：高中物理 - 力学部分）：
# 第一章 物理学导论
## 1.1 物理学的研究对象与学科定位
### 1.1.1 物理学的定义与研究范畴
### 1.1.2 物理学的分支学科体系
### 1.1.3 物理学与其他自然科学的关系
### 1.1.4 物理学的发展历程与重要里程碑
## 1.2 高中物理知识体系构建
### 1.2.1 力学模块知识框架
### 1.2.2 热学模块知识框架
### 1.2.3 电磁学模块知识框架
### 1.2.4 光学模块知识框架
### 1.2.5 原子物理模块知识框架
## 1.3 物理学习方法与能力培养
### 1.3.1 概念理解的有效策略
### 1.3.2 公式推导与应用技巧
### 1.3.3 实验设计与数据处理
### 1.3.4 问题解决的思维方法

# 第二章 运动学基础
## 2.1 运动的描述与基本概念
### 2.1.1 质点模型的建立与适用条件
### 2.1.2 参考系与坐标系的选择
### 2.1.3 位移与路程的区别与联系
### 2.1.4 速度与速率的定义及计算
### 2.1.5 加速度的概念与物理意义
### 2.1.6 速度变化率与加速度的关系
## 2.2 匀速直线运动
### 2.2.1 匀速直线运动的定义与特点
### 2.2.2 位移-时间公式与图像
### 2.2.3 速度-时间公式与图像
### 2.2.4 匀速运动的实例分析
## 2.3 匀变速直线运动
### 2.3.1 匀变速运动的定义与判定条件
### 2.3.2 速度时间公式推导与应用
### 2.3.3 位移时间公式推导与应用
### 2.3.4 速度位移公式推导与应用
### 2.3.5 平均速度公式的特殊性质
### 2.3.6 匀变速运动的重要推论
## 2.4 自由落体与竖直上抛运动
### 2.4.1 自由落体运动的定义与条件
### 2.4.2 重力加速度的测定与特性
### 2.4.3 自由落体公式的推导与应用
### 2.4.4 竖直上抛运动的对称性分析
### 2.4.5 竖直上抛运动的最大高度与时间
## 2.5 运动学图像分析
### 2.5.1 x-t图像的物理意义与解读
### 2.5.2 v-t图像的物理意义与解读
### 2.5.3 a-t图像的物理意义与解读
### 2.5.4 图像法解决运动学问题
## 2.6 相对运动与追及问题
### 2.6.1 相对速度的概念与计算
### 2.6.2 追及问题的分析方法
### 2.6.3 相遇问题的分析方法
### 2.6.4 避碰问题的临界条件分析

# 第三章 牛顿运动定律
## 3.1 牛顿第一定律与惯性
### 3.1.1 亚里士多德的运动观
### 3.1.2 伽利略的理想实验
### 3.1.3 牛顿第一定律的表述与意义
### 3.1.4 惯性的概念与质量的关系
### 3.1.5 惯性系与非惯性系的区别
## 3.2 牛顿第二定律
### 3.2.1 力与加速度的定量关系
### 3.2.2 牛顿第二定律的数学表达式
### 3.2.3 力的单位与量纲分析
### 3.2.4 牛顿第二定律的矢量性
### 3.2.5 合力的计算与加速度方向
## 3.3 牛顿第三定律
### 3.3.1 作用力与反作用力的概念
### 3.3.2 牛顿第三定律的表述
### 3.3.3 作用力与反作用力的特点
### 3.3.4 一对平衡力与作用力反作用力的区别
## 3.4 力学单位制
### 3.4.1 基本物理量与基本单位
### 3.4.2 导出物理量与导出单位
### 3.4.3 国际单位制（SI）
### 3.4.4 量纲分析的应用
## 3.5 牛顿定律的应用
### 3.5.1 受力分析的基本步骤
### 3.5.2 隔离法与整体法的应用
### 3.5.3 共点力平衡问题
### 3.5.4 非平衡状态下的动力学问题
### 3.5.5 连接体问题的分析方法

请直接输出大纲内容，不要添加任何开场白或解释。
`

function Outline() {
  const [topic, setTopic] = useState('')
  const [outline, setOutline] = useState<OutlineNode[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const { loading, generateContent } = useAgnesAPI()
  const { workflow, updateOutline, updateOutlineChapters, setCurrentStep, setIsRunning } = useWorkflow()
  const navigate = useNavigate()
  const [stopRequested, setStopRequested] = useState(false)
  const autoNavigateRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (autoNavigateRef.current) {
        clearTimeout(autoNavigateRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleNavigate = () => {
      if (autoNavigateRef.current) {
        clearTimeout(autoNavigateRef.current)
        autoNavigateRef.current = null
      }
    }

    window.addEventListener('popstate', handleNavigate)
    return () => {
      window.removeEventListener('popstate', handleNavigate)
    }
  }, [])

  const handleGenerate = async () => {
    if (!topic.trim()) return
    
    setStopRequested(false)
    setIsRunning(true)
    setCurrentStep('outline')
    
    const prompt = `${systemPrompt}\n\n学习主题：${topic}`
    const response = await generateContent(prompt)
    
    if (stopRequested) {
      setIsRunning(false)
      return
    }
    
    if (response) {
      updateOutline(response)
      const parsed = parseMarkdownToTree(response)
      setOutline(parsed)
      
      // 解析所有小节（三级标题）
      const chapters = extractChapters(response)
      updateOutlineChapters(chapters)
      
      // 如果启用了工作流，自动跳转到细纲分点
      if (workflow.enabled) {
        autoNavigateRef.current = setTimeout(() => {
          if (!stopRequested) {
            setCurrentStep('detail')
            navigate('/detail-outline')
          }
        }, 1000)
      }
    }
    
    setIsRunning(false)
  }

  // 提取所有小节（三级标题 ###）作为处理单元
  const extractChapters = (markdown: string): string[] => {
    const lines = markdown.trim().split('\n')
    const chapters: string[] = []
    
    let currentChapter = ''
    
    lines.forEach((line) => {
      // 提取一级标题（章）
      const level1Match = line.match(/^#\s+(.+)$/)
      if (level1Match) {
        currentChapter = level1Match[1].trim()
      }
      
      // 只提取三级标题（小节）作为处理单元
      const level3Match = line.match(/^###\s+(.+)$/)
      if (level3Match) {
        const section = level3Match[1].trim()
        // 如果有当前章，带上章名
        if (currentChapter) {
          chapters.push(`${currentChapter} - ${section}`)
        } else {
          chapters.push(section)
        }
      }
    })
    
    return chapters
  }

  const handleStop = () => {
    setStopRequested(true)
    setIsRunning(false)
    setCurrentStep(null)
  }

  const parseMarkdownToTree = (markdown: string): OutlineNode[] => {
    const lines = markdown.trim().split('\n')
    const nodes: OutlineNode[] = []
    const stack: { node: OutlineNode; level: number }[] = []
    
    lines.forEach((line) => {
      const match = line.match(/^(#{1,4})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const title = match[2].trim()
        const node: OutlineNode = { id: `${level}-${title}`, title, children: [] }
        
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop()
        }
        
        if (stack.length === 0) {
          nodes.push(node)
        } else {
          const parentNode = stack[stack.length - 1].node
          if (!parentNode.children) {
            parentNode.children = []
          }
          parentNode.children.push(node)
        }
        
        stack.push({ node, level })
      }
    })
    
    return nodes
  }

  const renderOutline = (nodes: OutlineNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="outline-item">
        <div 
          className="outline-title"
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          {node.children && node.children.length > 0 && (
            <button 
              className="expand-btn"
              onClick={() => {
                setIsExpanded(!isExpanded)
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <BookOpen size={16} className="outline-icon" />
          <span>{node.title}</span>
        </div>
        {isExpanded && node.children && node.children.length > 0 && (
          <div className="outline-children">
            {renderOutline(node.children, depth + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="outline-page">
      <div className="page-header">
        <h1 className="page-title">大纲目录</h1>
        <p className="page-desc">基于Agnes AI自动生成专业的教科书大纲结构</p>
      </div>

      <div className="input-section">
        <div className="input-group">
          <input
            type="text"
            className="input-field"
            placeholder="请输入学习主题，例如：机器学习、量子力学、中国历史..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleGenerate()}
          />
          {loading ? (
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
              disabled={!topic.trim()}
            >
              {workflow.enabled ? <Play size={18} /> : <Send size={18} />}
              {workflow.enabled ? '开始工作流' : '生成大纲'}
            </button>
          )}
        </div>
      </div>

      <div className="system-prompt-section">
        <h3 className="section-title">系统指令</h3>
        <div className="prompt-content">
          <pre>{systemPrompt}</pre>
        </div>
      </div>

      {outline.length > 0 && (
        <div className="outline-section">
          <div className="section-header">
            <h3 className="section-title">生成的大纲</h3>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setOutline([])
              }}
            >
              <Trash2 size={16} />
              清空
            </button>
          </div>
          <div className="outline-tree">
            {renderOutline(outline)}
          </div>
        </div>
      )}
    </div>
  )
}

export default Outline