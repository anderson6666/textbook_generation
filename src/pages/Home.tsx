import { BookOpen, Sparkles, Zap, Target, ArrowRight, RotateCcw, History } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useWorkflow } from '../context/WorkflowContext'

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
    // 启用工作流
    setWorkflowEnabled(true)
    
    if (workflow.currentStep === 'outline') {
      navigate('/outline')
    } else if (workflow.currentStep === 'detail') {
      navigate('/detail-outline')
    } else if (workflow.currentStep === 'output') {
      navigate('/knowledge-output')
    } else {
      navigate('/outline')
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
                {workflow.currentStep === 'outline' && '大纲目录'}
                {workflow.currentStep === 'detail' && `细纲分点 (${workflow.currentChapterIndex + 1}/${workflow.outlineChapters.length})`}
                {workflow.currentStep === 'output' && '知识输出'}
                {!workflow.currentStep && '已暂停'}
              </span>
              <span className="progress-detail">
                {workflow.outline && '大纲已生成'}
                {Object.keys(workflow.detailSections).length > 0 && ` · ${Object.keys(workflow.detailSections).length}个细纲`}
                {workflow.output && ' · 知识输出已完成'}
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
            {history.slice(0, 6).map((item, index) => (
              <div key={item.timestamp} className="history-card" onClick={() => {
                loadFromHistory(index)
                navigate('/outline')
              }}>
                <span className="history-topic">{item.topic}</span>
                <span className="history-time">{formatDate(item.timestamp)}</span>
              </div>
            ))}
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