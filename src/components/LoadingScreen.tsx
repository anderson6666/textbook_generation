import { useState, useEffect } from 'react'
import './LoadingScreen.css'

interface LoadingStep {
  label: string
  progress: number
}

export default function LoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const loadingSteps: LoadingStep[] = [
    { label: '初始化应用', progress: 10 },
    { label: '加载配置', progress: 20 },
    { label: '连接数据库', progress: 35 },
    { label: '加载历史记录', progress: 50 },
    { label: '恢复工作流', progress: 70 },
    { label: '准备界面', progress: 85 },
    { label: '完成初始化', progress: 100 },
  ]

  useEffect(() => {
    const executeStep = async (stepIndex: number) => {
      if (stepIndex >= loadingSteps.length) {
        setTimeout(() => {
          setIsComplete(true)
        }, 300)
        return
      }

      const step = loadingSteps[stepIndex]
      setCurrentStep(stepIndex)

      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100))
      
      setProgress(step.progress)
      executeStep(stepIndex + 1)
    }

    executeStep(0)
  }, [])

  return (
    <div className={`loading-screen ${isComplete ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="logo-container">
          <div className="logo-icon">📚</div>
          <h1 className="logo-text">教科书编辑器</h1>
        </div>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
            <div className="progress-glow" />
          </div>
          <div className="progress-info">
            <span className="progress-text">{progress}%</span>
            <span className="progress-label">{loadingSteps[currentStep]?.label}</span>
          </div>
        </div>
      </div>

      <div className="loading-particles">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}