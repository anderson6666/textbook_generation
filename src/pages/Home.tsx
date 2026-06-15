import { BookOpen, Sparkles, Zap, Target, ArrowRight, RotateCcw, History } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useWorkflow } from '../context/WorkflowContext'
import { GlobalLoadingContext } from '../App'

const features = [
  {
    icon: BookOpen,
    title: '智能大纲生成',
    description: '基于Agnes AI自动生成专业的教科书大纲结构',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Sparkles,
    title: '细纲分点细化',
    description: '深入拆解每个知识点，构建完整的知识体系',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: '知识输出优化',
    description: '支持MD和LaTeX格式，完美展示专业内容',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Target,
    title: '终身学习伴侣',
    description: '助力持续学习，打造个人知识宝库',
    color: 'from-green-500 to-teal-500',
  },
]

function Home() {
  const { workflow, history, loadFromHistory, setWorkflowEnabled } = useWorkflow()
  const navigate = useNavigate()

  const hasProgress = workflow.outline || Object.keys(workflow.detailSections).length > 0 || workflow.output

  const handleContinue = () => {
    try {
      // 先设置工作流启用状态
      setWorkflowEnabled(true)
      
      const hasOutline = workflow.outline && workflow.outline.trim()
      const hasOutlineChapters = workflow.outlineChapters.length > 0
      const hasDetailSections = Object.keys(workflow.detailSections).length > 0
      
      // 判断细纲是否全部完成
      const detailCompleted = hasOutlineChapters && (Object.keys(workflow.detailSections).length >= workflow.outlineChapters.length)
      // 判断输出是否全部完成
      const outputCompleted = detailCompleted && (Object.keys(workflow.outputSections).length >= workflow.outlineChapters.length)
      
      // 确定目标路径
      let targetPath = '/outline'
      
      if (!detailCompleted && hasOutlineChapters) {
        targetPath = '/detail-outline'
      } else if (workflow.currentStep === 'output') {
        targetPath = '/knowledge-output'
      } else if (workflow.currentStep === 'detail') {
        targetPath = '/detail-outline'
      } else if (workflow.currentStep === 'outline') {
        targetPath = '/outline'
      } else {
        // currentStep 为 null 时，根据已有内容判断
        if (outputCompleted) {
          targetPath = '/knowledge-output'
        } else if (detailCompleted) {
          targetPath = '/knowledge-output'
        } else if (hasDetailSections) {
          targetPath = '/detail-outline'
        } else if (hasOutline) {
          targetPath = '/outline'
        }
      }
      
      // 先导航，确保用户能看到页面切换
      navigate(targetPath)
      
      // 导航完成后再设置加载状态
      setTimeout(() => {
        GlobalLoadingContext.setGlobalLoading(true)
      }, 100)
      
      // 1秒后关闭加载状态
      setTimeout(() => {
        GlobalLoadingContext.setGlobalLoading(false)
      }, 1000)
    } catch (error) {
      console.error('继续生成失败:', error)
      GlobalLoadingContext.setGlobalLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <h1 className="title">
            终身学习者的
            <span className="highlight">教科书编辑器</span>
          </h1>
          <p className="subtitle">
            基于Agnes AI，从大纲到知识输出，一站式构建你的专属知识库
          </p>
          <div className="header-actions">
            {hasProgress ? (
              <>
                <button onClick={handleContinue} className="btn btn-primary">
                  <RotateCcw className="btn-icon" />
                  继续生成
                </button>
                <Link to="/outline" className="btn btn-secondary">
                  新建项目
                </Link>
              </>
            ) : (
              <>
                <Link to="/outline" className="btn btn-primary">
                  开始创作
                  <ArrowRight className="btn-icon" />
                </Link>
                <Link to="/settings" className="btn btn-secondary">
                  配置设置
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="header-visual">
          <div className="floating-card card-1">
            <BookOpen className="card-icon" />
            <span>大纲目录</span>
          </div>
          <div className="floating-card card-2">
            <Sparkles className="card-icon" />
            <span>细纲分点</span>
          </div>
          <div className="floating-card card-3">
            <Zap className="card-icon" />
            <span>知识输出</span>
          </div>
        </div>
      </header>

      {hasProgress && (
        <section className="progress-section">
          <h2 className="section-title">
            <RotateCcw size={20} />
            当前进度
          </h2>
          <div className="progress-card">
            <div className="progress-info">
              <span className="progress-step">
                {(() => {
                  const hasOutline = !!workflow.outline && workflow.outline.trim()
                  const detailCount = Object.keys(workflow.detailSections).length
                  const totalChapters = workflow.outlineChapters.length
                  const outputCount = Object.keys(workflow.outputSections).length
                  
                  if (!hasOutline) {
                    return '大纲目录'
                  }
                  
                  if (detailCount === 0) {
                    return '大纲已完成'
                  }
                  
                  if (outputCount === 0) {
                    return `细纲分点 (${detailCount}/${totalChapters})`
                  }
                  
                  return `知识输出 (${outputCount}/${totalChapters})`
                })()}
              </span>
              <span className="progress-detail">
                {workflow.outline && '大纲已生成'}
                {Object.keys(workflow.detailSections).length > 0 && ` · ${Object.keys(workflow.detailSections).length}个细纲`}
                {Object.keys(workflow.outputSections).length > 0 && ` · ${Object.keys(workflow.outputSections).length}个知识输出`}
              </span>
            </div>
            <button onClick={handleContinue} className="btn btn-small">
              继续
            </button>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="history-section">
          <h2 className="section-title">
            <History size={20} />
            历史记录
          </h2>
          <div className="history-grid">
            {[...history].reverse().slice(0, 6).map((item, displayIndex) => {
              const actualIndex = history.length - 1 - displayIndex
              return (
                <div key={item.timestamp} className="history-card" onClick={() => {
                  // 先启用工作流
                  setWorkflowEnabled(true)
                  GlobalLoadingContext.setGlobalLoading(true)
                  loadFromHistory(actualIndex)
                  
                  // 根据历史记录的状态跳转到未完成的页面继续工作
                  // 细纲与正文会并行工作，但优先完成细纲
                  const hasOutline = item.outline && item.outline.trim()
                  const hasOutlineChapters = item.outlineChapters && item.outlineChapters.length > 0
                  const detailCount = item.detailSections ? Object.keys(item.detailSections).length : 0
                  const outputCount = item.outputSections ? Object.keys(item.outputSections).length : 0
                  const totalChapters = item.outlineChapters?.length || 0
                  
                  let targetPath = '/outline'
                  
                  // 按顺序检查：大纲 → 细纲 → 知识输出
                  // 只要细纲未完成（输出数量少于章节数量），就跳转到细纲页面
                  if (!hasOutline) {
                    targetPath = '/outline'
                  } else if (!hasOutlineChapters) {
                    targetPath = '/outline'
                  } else if (detailCount < totalChapters || outputCount < totalChapters) {
                    // 细纲未完成，或者输出未完成，都跳转到细纲页面继续工作
                    targetPath = '/detail-outline'
                  } else {
                    // 全部完成，跳转到知识输出页面展示结果
                    targetPath = '/knowledge-output'
                  }
                  
                  navigate(targetPath)
                  setTimeout(() => {
                    GlobalLoadingContext.setGlobalLoading(false)
                  }, 500)
                }}>
                  <span className="history-topic">{item.topic}</span>
                  <span className="history-time">{formatDate(item.timestamp)}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="features-section">
        <h2 className="section-title">核心功能</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className={`feature-icon bg-gradient-to-br ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="workflow-section">
        <h2 className="section-title">工作流程</h2>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <h3>输入主题</h3>
            <p>输入你想学习的主题或领域</p>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <h3>生成大纲</h3>
            <p>Agnes AI自动生成结构化大纲</p>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <h3>细化内容</h3>
            <p>深入拆解每个知识节点</p>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="step-number">4</div>
            <h3>输出知识</h3>
            <p>生成MD/LaTeX格式的学习资料</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home