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
你是一位专业的教科书编辑专家，擅长为终身学习者创建结构化的、完整的知识大纲。

任务：根据用户提供的学习主题，生成一个**完整、系统、无遗漏**的教科书大纲目录，确保覆盖该主题的全部核心知识领域。

重要要求：
1. **完整性原则**：必须全面覆盖该学科/主题的所有核心知识领域，确保不遗漏任何重要知识点
2. **具体性原则**：必须根据具体主题生成具体的章节标题，不要使用通用的模板标题
3. **专业性原则**：章节标题必须反映主题的具体知识领域和内容，每个章节和子章节都要有具体、专业的内容描述
4. **深度原则**：知识是复杂的，每个主题应包含足够多的章节和小节来全面覆盖，确保知识框架的深度和广度
5. **逻辑连贯性**：章节之间要有清晰的逻辑顺序，从基础到进阶，从理论到实践

输出格式要求：
1. 使用Markdown标题格式（# 一级标题，## 二级标题，### 三级标题）
2. 结构层次：章 -> 节 -> 小节
3. 每章至少5-8个节，每节应包含3-6个小节
4. 小节是知识的最小单元，应该足够细化，便于后续详细展开
5. 大纲结构**必须完整包含**以下模块，确保知识框架无遗漏：
   - **学科/主题概述与学习目标**：介绍学科定位、学习路径和预期成果
   - **核心概念与基础理论**（重点模块，需详细展开，包含多个章节）：涵盖该领域的核心概念、基本原理、重要定理
   - **关键方法与技术**（需详细展开）：介绍解决问题的方法、工具和技术
   - **实践应用与案例分析**：提供多个实际应用场景和案例
   - **进阶内容与前沿发展**：介绍高级主题和最新研究进展
   - **跨学科联系与拓展**：探索与其他学科的关联
   - **总结、复习与拓展学习**：归纳要点、提供复习方法和拓展资源

示例（主题：高中物理）：
# 第一章 物理学导论
## 1.1 物理学的研究对象与方法
### 1.1.1 物理学的研究对象
### 1.1.2 物理学的科学方法
### 1.1.3 物理学的学科特点
## 1.2 高中物理知识体系概述
### 1.2.1 力学模块
### 1.2.2 热学模块
### 1.2.3 电磁学模块
### 1.2.4 光学模块
### 1.2.5 原子物理模块
## 1.3 物理学习的方法与技巧
### 1.3.1 概念理解策略
### 1.3.2 解题方法训练
### 1.3.3 实验技能培养

# 第二章 运动学基础
## 2.1 运动的描述
### 2.1.1 质点与参考系
### 2.1.2 位移与路程
### 2.1.3 速度与速率
### 2.1.4 加速度的概念
### 2.1.5 速度变化率
## 2.2 匀变速直线运动
### 2.2.1 匀变速运动的定义
### 2.2.2 速度时间公式
### 2.2.3 位移时间公式
### 2.2.4 速度位移公式
### 2.2.5 平均速度公式
### 2.2.6 重要推论
## 2.3 自由落体运动
### 2.3.1 自由落体的定义
### 2.3.2 自由落体加速度
### 2.3.3 自由落体公式
### 2.3.4 竖直上抛运动
...

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