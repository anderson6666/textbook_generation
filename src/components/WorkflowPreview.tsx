import { useState, useEffect, useMemo } from 'react'
import { X, Eye, History, Trash2, RotateCcw, Play, Sparkles } from 'lucide-react'
import { useWorkflow } from '../context/WorkflowContext'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

function WorkflowPreview() {
  const { workflow, workflow: wf, history, resetWorkflow, setWorkflowEnabled, setCurrentStep, saveToHistory, loadFromHistory, deleteHistory } = useWorkflow()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [lastDetailCount, setLastDetailCount] = useState(0)

  // 计算是否有内容
  const detailSectionsCount = Object.keys(workflow.detailSections).length
  const outputSectionsCount = Object.keys(workflow.outputSections).length
  const hasContent = workflow.outline || workflow.detail || workflow.output || detailSectionsCount > 0 || outputSectionsCount > 0

  // 当有新内容时自动显示预览
  useEffect(() => {
    if (hasContent) {
      setIsVisible(true)
    }
  }, [hasContent, detailSectionsCount, outputSectionsCount, workflow.outline, workflow.output])

  // 当细纲数量变化时，强制更新
  useEffect(() => {
    if (detailSectionsCount !== lastDetailCount) {
      setLastDetailCount(detailSectionsCount)
    }
  }, [detailSectionsCount, lastDetailCount])

  // 加载历史并跳转到正确的页面
  const handleLoadHistory = (index: number) => {
    loadFromHistory(index)
    // 启用工作流
    setWorkflowEnabled(true)
    
    const item = history[index]
    if (item) {
      const outlineChapters = item.outlineChapters || []
      const detailSections = item.detailSections || {}
      
      // 找到第一个未生成细纲的小节
      const firstMissingIndex = outlineChapters.findIndex(
        (chapter) => !detailSections[chapter]
      )
      
      if (firstMissingIndex === -1) {
        // 所有小节都有细纲，跳转到知识输出
        navigate('/knowledge-output')
      } else {
        // 跳转到细纲分点继续生成
        navigate('/detail-outline')
      }
    }
  }

  if (!isVisible) {
    // 显示最小化的预览按钮
    if (hasContent) {
      return (
        <div className="workflow-preview-minimized" onClick={() => setIsVisible(true)}>
          <Eye size={16} />
          <span>预览</span>
          {workflow.currentStep && (
            <span className="preview-mini-badge">
              {workflow.currentStep === 'outline' && '大纲'}
              {workflow.currentStep === 'detail' && `${detailSectionsCount}/${workflow.outlineChapters.length}`}
              {workflow.currentStep === 'output' && '输出'}
            </span>
          )}
        </div>
      )
    }
    return null
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  const handleReset = () => {
    // 保存到历史
    if (workflow.outline) {
      const topicMatch = workflow.outline.match(/^#\s*(.+?)\s*$/m)
      const topic = topicMatch ? topicMatch[1] : '未命名'
      saveToHistory(topic)
    }
    resetWorkflow()
    setWorkflowEnabled(false)
    setIsVisible(false)
  }

  const handleSaveToHistory = () => {
    if (workflow.outline) {
      const topicMatch = workflow.outline.match(/^#\s*(.+?)\s*$/m)
      const topic = topicMatch ? topicMatch[1] : '未命名'
      saveToHistory(topic)
      alert('已保存到历史记录')
    }
  }

  // 从大纲中提取特定章节的内容
  const extractOutlineSection = (outline: string, chapter: string) => {
    const lines = outline.split('\n')

    const startIndex = lines.findIndex(line => {
      const normalizedLine = line.replace(/^#+\s*/, '').trim()
      return normalizedLine === chapter.trim()
    })

    if (startIndex === -1) return ''

    const result: string[] = []

    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i]

      if (/^#{1,2}\s+/.test(line)) {
        break
      }

      result.push(line)
    }

    return result.join('\n').trim()
  }

  // 合并所有内容为一个完整的文档
  const buildFullDocument = () => {
    if (!workflow.outline) return ''

    let fullContent = ''

    const outline = workflow.outline
    const chapters = workflow.outlineChapters || []
    const outputSections = workflow.outputSections || {}

    if (!chapters.length) {
      fullContent += outline + '\n\n'

      if (detailSectionsCount > 0) {
        fullContent += '\n\n---\n\n# 细纲分点详解\n\n'

        Object.entries(workflow.detailSections).forEach(([chapter, content]) => {
          fullContent += `## ${chapter}\n\n${content}\n\n`
        })
      }

      if (workflow.output) {
        fullContent += '\n\n---\n\n# 知识输出\n\n'
        fullContent += workflow.output
      }

      return fullContent
    }

    const titleMatch = outline.match(/^#\s+(.+)$/m)

    if (titleMatch) {
      fullContent += `# ${titleMatch[1]}\n\n`
    }

    chapters.forEach((chapter: string, index: number) => {
      fullContent += `## ${chapter}\n\n`

      const outlineSection = extractOutlineSection(outline, chapter)

      if (outlineSection) {
        fullContent += `${outlineSection}\n\n`
      }

      const detailContent = workflow.detailSections?.[chapter]

      if (detailContent) {
        fullContent += `### 细纲\n\n${detailContent}\n\n`
      }

      const outputContent = outputSections[chapter]

      if (outputContent) {
        fullContent += `### 正文\n\n${outputContent}\n\n`
      } else if (Object.keys(outputSections).length > 0) {
        // 如果其他章节已有正文但当前章节没有，显示提示
        fullContent += `### 正文\n\n（待生成）\n\n`
      }

      /**
       * 兼容旧数据结构：
       * 如果没有分章节正文，则把 workflow.output 放在文档最后。
       */
      if (
        !Object.keys(outputSections).length &&
        workflow.output &&
        index === chapters.length - 1
      ) {
        fullContent += `---\n\n# 知识输出\n\n${workflow.output}\n\n`
      }
    })

    return fullContent
  }

  const handleContinueGeneration = () => {
    // 启用工作流并跳转到下一个需要处理的页面
    setWorkflowEnabled(true)
    
    if (wf.currentStep === 'outline') {
      navigate('/outline')
    } else if (wf.currentStep === 'detail') {
      navigate('/detail-outline')
    } else if (wf.currentStep === 'output') {
      navigate('/knowledge-output')
    }
  }

  const handleGenerateContent = () => {
    // 对已有细纲的章节生成正文
    setWorkflowEnabled(true)
    setCurrentStep('output')
    navigate('/knowledge-output')
  }

  // 检查是否有未完成的细纲
  const hasUnfinishedDetail = wf.outlineChapters.length > 0 && 
    wf.outlineChapters.some(chapter => !wf.detailSections[chapter])
  
  // 检查是否有细纲内容（始终显示预生成按钮，方便重新生成）
  const hasDetailButNoOutput = Object.keys(wf.detailSections).length > 0

  // 构建完整文档
  const fullDocument = useMemo(() => {
    return buildFullDocument()
  }, [
    workflow.outline,
    workflow.outlineChapters,
    workflow.detailSections,
    workflow.output,
    workflow.outputSections,
    detailSectionsCount,
  ])

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
    <div className="workflow-preview">
      <div className="preview-header">
        <div className="preview-title">
          <Eye size={18} />
          <span>实时预览</span>
          {workflow.currentStep && (
            <span className="preview-step-badge">
              {workflow.currentStep === 'outline' && '大纲'}
              {workflow.currentStep === 'detail' && `细纲 ${workflow.currentChapterIndex + 1}/${workflow.outlineChapters.length}`}
              {workflow.currentStep === 'output' && '输出'}
            </span>
          )}
        </div>
        <div className="preview-actions">
          <button
            className="preview-history-btn"
            onClick={() => setShowHistory(!showHistory)}
            title="历史记录"
          >
            <History size={16} />
          </button>
          <button
            className="preview-minimize"
            onClick={handleClose}
            title="最小化预览"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="preview-history-panel">
          <div className="history-header">
            <span>历史记录 ({history.length})</span>
            <button onClick={() => setShowHistory(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-empty">暂无历史记录</div>
            ) : (
              history.map((item, index) => {
                const totalChapters = item.outlineChapters?.length || 0
                const completedChapters = Object.keys(item.detailSections || {}).length
                const progress = totalChapters > 0 ? `${completedChapters}/${totalChapters}` : '-'
                
                return (
                  <div key={item.timestamp} className="history-item">
                    <div className="history-item-info">
                      <span className="history-topic">{item.topic}</span>
                      <div className="history-meta">
                        <span className="history-time">{formatDate(item.timestamp)}</span>
                        <span className="history-progress">进度: {progress}</span>
                      </div>
                    </div>
                    <div className="history-item-actions">
                      <button onClick={() => handleLoadHistory(index)} title="加载并继续">
                        <RotateCcw size={14} />
                      </button>
                      <button onClick={() => deleteHistory(index)} title="删除">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      <div className="preview-content">
        <div className="preview-full-document">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {fullDocument}
          </ReactMarkdown>
        </div>
      </div>

      <div className="preview-footer">
        {hasUnfinishedDetail && (
          <button className="preview-continue" onClick={handleContinueGeneration}>
            <Play size={16} className="btn-icon" />
            继续生成细纲
          </button>
        )}
        {hasDetailButNoOutput && (
          <button className="preview-generate-content" onClick={handleGenerateContent}>
            <Sparkles size={16} className="btn-icon" />
            预生成正文
          </button>
        )}
        <button className="preview-save" onClick={handleSaveToHistory}>
          保存到历史
        </button>
        <button className="preview-reset" onClick={handleReset}>
          完成工作流
        </button>
      </div>
    </div>
  )
}

export default WorkflowPreview