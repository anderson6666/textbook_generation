import { Home, BookOpen, List, FileText, Settings, Loader2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useWorkflow } from '../context/WorkflowContext'

const menuItems = [
  { icon: Home, label: '首页', path: '/', step: null },
  { icon: BookOpen, label: '大纲目录', path: '/outline', step: 'outline' },
  { icon: List, label: '细纲分点', path: '/detail-outline', step: 'detail' },
  { icon: FileText, label: '知识输出', path: '/knowledge-output', step: 'output' },
  { icon: Settings, label: '设置', path: '/settings', step: null },
]

function Sidebar() {
  const { workflow } = useWorkflow()
  
  // 计算总体进度
  const calculateProgress = () => {
    if (!workflow.enabled || !workflow.currentStep) return 0
    
    // 大纲完成 = 33%
    // 细纲完成 = 33% - 66%
    // 知识输出完成 = 66% - 100%
    
    if (workflow.currentStep === 'outline') {
      return workflow.outline ? 33 : 10
    }
    
    if (workflow.currentStep === 'detail') {
      const detailProgress = workflow.outlineChapters.length > 0 
        ? (workflow.currentChapterIndex / workflow.outlineChapters.length) * 33 
        : 0
      return 33 + detailProgress
    }
    
    if (workflow.currentStep === 'output') {
      return workflow.output ? 100 : 66
    }
    
    return 0
  }
  
  const progress = calculateProgress()
  const isRunning = workflow.enabled && workflow.currentStep

  return (
    <aside className={`sidebar ${isRunning ? 'sidebar-working' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <BookOpen className="logo-icon" />
          <span className="logo-text">教科书编辑器</span>
        </div>
        
        {isRunning && (
          <div className="workflow-status">
            <div className="workflow-progress-bar">
              <div 
                className="workflow-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="workflow-progress-info">
              <Loader2 className="workflow-spinner" size={14} />
              <span className="workflow-progress-text">
                {workflow.currentStep === 'outline' && '生成大纲...'}
                {workflow.currentStep === 'detail' && `处理细纲 ${workflow.currentChapterIndex + 1}/${workflow.outlineChapters.length}`}
                {workflow.currentStep === 'output' && '生成知识输出...'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isCurrentStep = item.step === workflow.currentStep
          const isCompleted = 
            (item.step === 'outline' && workflow.outline) ||
            (item.step === 'detail' && Object.keys(workflow.detailSections).length > 0) ||
            (item.step === 'output' && workflow.output)
          
          // 工作流运行时，非当前步骤不可点击
          const isDisabled = isRunning && !isCurrentStep
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''} ${isCurrentStep && isRunning ? 'current-step' : ''} ${isCompleted ? 'completed' : ''} ${isDisabled ? 'disabled' : ''}`
              }
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              style={isDisabled ? { pointerEvents: 'none' } : undefined}
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {isCurrentStep && isRunning && (
                <Loader2 className="nav-spinner" size={14} />
              )}
            </NavLink>
          )
        })}
      </nav>
      
      <div className="sidebar-footer">
        <div className="version">v1.0.0</div>
        <div className="powered-by">Powered by Agnes AI</div>
      </div>
    </aside>
  )
}

export default Sidebar