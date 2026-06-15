import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Eye, History, Trash2, RotateCcw, Play, ChevronDown, ChevronUp } from 'lucide-react'
import { useWorkflow } from '../context/WorkflowContext'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import Danmaku from './Danmaku'

interface ChapterContent {
  title: string
  outline: string
  detail: string
  output: string
}

function WorkflowPreview() {
  const { workflow, history, setWorkflowEnabled, setCurrentStep, setIsRunning, saveToHistory, loadFromHistory, deleteHistory } = useWorkflow()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [lastDetailCount, setLastDetailCount] = useState(0)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [danmakuContent, setDanmakuContent] = useState('')
  const [isNewDanmaku, setIsNewDanmaku] = useState(false)

  const detailSections = workflow.detailSections || {}
  const outputSections = workflow.outputSections || {}
  const outlineChapters = workflow.outlineChapters || []

  const detailSectionsCount = Object.keys(detailSections).length
  const outputSectionsCount = Object.keys(outputSections).length
  const hasContent = !!(workflow.outline || workflow.detail || workflow.output || detailSectionsCount > 0 || outputSectionsCount > 0)
  const hasDisplayableContent = !!(workflow.outline || workflow.output)

  useEffect(() => {
    if (hasContent) {
      setIsVisible(true)
    }
  }, [hasContent])

  useEffect(() => {
    if (detailSectionsCount !== lastDetailCount) {
      setLastDetailCount(detailSectionsCount)
    }
  }, [detailSectionsCount, lastDetailCount])

  useEffect(() => {
    const currentDetailKeys = Object.keys(detailSections)
    const currentOutputKeys = Object.keys(outputSections)
    
    if (currentDetailKeys.length > lastDetailCount) {
      const newDetailKey = currentDetailKeys[currentDetailKeys.length - 1]
      const newDetailContent = detailSections[newDetailKey]
      if (newDetailContent) {
        setDanmakuContent(`[细纲] ${newDetailKey}: ${newDetailContent}`)
        setIsNewDanmaku(true)
        setTimeout(() => setIsNewDanmaku(false), 100)
      }
    }

    if (currentOutputKeys.length > outputSectionsCount) {
      const newOutputKey = currentOutputKeys[currentOutputKeys.length - 1]
      const newOutputContent = outputSections[newOutputKey]
      if (newOutputContent) {
        setDanmakuContent(`[正文] ${newOutputKey}: ${newOutputContent}`)
        setIsNewDanmaku(true)
        setTimeout(() => setIsNewDanmaku(false), 100)
      }
    }
  }, [detailSections, outputSections, detailSectionsCount, outputSectionsCount, lastDetailCount])

  const documentSections = useMemo((): ChapterContent[] => {
    if (!workflow.outline) return []

    const sections: ChapterContent[] = []
    const outline = workflow.outline

    if (!outlineChapters.length) {
      sections.push({
        title: outline.match(/^#\s+(.+)$/m)?.[1] || '无标题',
        outline: outline,
        detail: detailSectionsCount > 0 ? Object.entries(detailSections).map(([ch, ct]) => `## ${ch}\n\n${ct}`).join('\n\n') : '',
        output: workflow.output || ''
      })
      return sections
    }

    outlineChapters.forEach((chapter: string) => {
      const lines = outline.split('\n')
      const startIndex = lines.findIndex(line => {
        const normalizedLine = line.replace(/^#+\s*/, '').trim()
        return normalizedLine === chapter.trim()
      })

      let outlineSection = ''
      if (startIndex !== -1) {
        const result: string[] = []
        for (let i = startIndex + 1; i < lines.length; i++) {
          const line = lines[i]
          if (/^#{1,2}\s+/.test(line)) {
            break
          }
          result.push(line)
        }
        outlineSection = result.join('\n').trim()
      }

      sections.push({
        title: chapter,
        outline: outlineSection,
        detail: detailSections[chapter] || '',
        output: outputSections[chapter] || ''
      })
    })

    if (!Object.keys(outputSections).length && workflow.output) {
      sections[sections.length - 1].output += `\n\n---\n\n# 知识输出\n\n${workflow.output}`
    }

    return sections
  }, [workflow.outline, outlineChapters, detailSections, workflow.output, outputSections, detailSectionsCount])

  const fullDocument = useMemo(() => {
    if (!workflow.outline) return ''

    let fullContent = ''
    const outline = workflow.outline

    if (!outlineChapters.length) {
      fullContent += outline + '\n\n'

      if (detailSectionsCount > 0) {
        fullContent += '\n\n---\n\n# 细纲分点详解\n\n'
        Object.entries(detailSections).forEach(([chapter, content]) => {
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

    outlineChapters.forEach((chapter: string, index: number) => {
      fullContent += `## ${chapter}\n\n`

      const lines = outline.split('\n')
      const startIndex = lines.findIndex(line => {
        const normalizedLine = line.replace(/^#+\s*/, '').trim()
        return normalizedLine === chapter.trim()
      })

      if (startIndex !== -1) {
        const result: string[] = []
        for (let i = startIndex + 1; i < lines.length; i++) {
          const line = lines[i]
          if (/^#{1,2}\s+/.test(line)) {
            break
          }
          result.push(line)
        }
        const outlineSection = result.join('\n').trim()
        if (outlineSection) {
          fullContent += `${outlineSection}\n\n`
        }
      }

      const detailContent = detailSections[chapter]
      if (detailContent) {
        fullContent += `### 细纲\n\n${detailContent}\n\n`
      }

      const outputContent = outputSections[chapter]
      if (outputContent) {
        fullContent += `### 正文\n\n${outputContent}\n\n`
      } else if (Object.keys(outputSections).length > 0) {
        fullContent += `### 正文\n\n（待生成）\n\n`
      }

      if (!Object.keys(outputSections).length && workflow.output && index === outlineChapters.length - 1) {
        fullContent += `---\n\n# 知识输出\n\n${workflow.output}\n\n`
      }
    })

    return fullContent
  }, [workflow.outline, outlineChapters, detailSections, workflow.output, outputSections, detailSectionsCount])

  const hasUnfinishedDetail = outlineChapters.length > 0 &&
    outlineChapters.some(chapter => !detailSections[chapter])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleLoadHistory = (index: number) => {
    loadFromHistory(index)
    setWorkflowEnabled(true)
    
    const item = history[index]
    if (item) {
      const outlineChapters = item.outlineChapters || []
      const detailSections = item.detailSections || {}
      
      const firstMissingIndex = outlineChapters.findIndex(
        (chapter) => !detailSections[chapter]
      )
      
      if (firstMissingIndex === -1) {
        navigate('/knowledge-output')
      } else {
        navigate('/detail-outline')
      }
    }
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  const handleReset = () => {
    if (workflow.outline) {
      const topicMatch = workflow.outline.match(/^#\s*(.+?)\s*$/m)
      const topic = topicMatch ? topicMatch[1] : '未命名'
      saveToHistory(topic)
      
      // 停止运行状态，退出灰色遮罩，但保持工作流选项打开
      setIsRunning(false)
      setCurrentStep(null)
      
      alert('工作流已完成并保存到历史记录')
    } else {
      alert('没有可保存的内容')
    }
  }

  const handleSaveToHistory = () => {
    if (workflow.outline) {
      const topicMatch = workflow.outline.match(/^#\s*(.+?)\s*$/m)
      const topic = topicMatch ? topicMatch[1] : '未命名'
      saveToHistory(topic)
      alert('已保存到历史记录')
    }
  }

  const handleContinueGeneration = () => {
    try {
      setWorkflowEnabled(true)
      
      let targetPath = '/detail-outline'
      
      if (workflow.currentStep === 'outline') {
        targetPath = '/outline'
      } else if (workflow.currentStep === 'detail') {
        targetPath = '/detail-outline'
      } else if (workflow.currentStep === 'output') {
        targetPath = '/knowledge-output'
      }
      
      navigate(targetPath)
    } catch (error) {
      console.error('继续生成失败:', error)
    }
  }



  const toggleChapter = useCallback((chapter: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapter)) {
        next.delete(chapter)
      } else {
        next.add(chapter)
      }
      return next
    })
  }, [])

  const toggleAllChapters = useCallback(() => {
    if (expandedChapters.size === outlineChapters.length) {
      setExpandedChapters(new Set())
    } else {
      setExpandedChapters(new Set(outlineChapters))
    }
  }, [expandedChapters.size, outlineChapters])

  if (!hasDisplayableContent) {
    return null
  }

  if (!isVisible) {
    return (
      <div className="workflow-preview-minimized" onClick={() => setIsVisible(true)}>
        <Eye size={16} />
        <span>预览</span>
        {workflow.currentStep && (
          <span className="preview-mini-badge">
            {workflow.currentStep === 'outline' && '大纲'}
            {workflow.currentStep === 'detail' && `${detailSectionsCount}/${outlineChapters.length}`}
            {workflow.currentStep === 'output' && '输出'}
          </span>
        )}
      </div>
    )
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
              {workflow.currentStep === 'detail' && `细纲 ${detailSectionsCount}/${outlineChapters.length}`}
              {workflow.currentStep === 'output' && `输出 ${outputSectionsCount}/${outlineChapters.length}`}
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
          {outlineChapters.length > 0 && (
            <button
              className="preview-collapse-btn"
              onClick={toggleAllChapters}
              title={expandedChapters.size === outlineChapters.length ? '折叠全部' : '展开全部'}
            >
              {expandedChapters.size === outlineChapters.length ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
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
              history.map((item: any, index: number) => {
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
        {outlineChapters.length > 0 ? (
          <div className="preview-chapters">
            {documentSections.map((section, index) => {
              const isExpanded = expandedChapters.has(section.title)
              return (
                <div key={index} className="chapter-container">
                  <button 
                    className="chapter-header" 
                    onClick={() => toggleChapter(section.title)}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>{section.title}</span>
                  </button>
                  {isExpanded && (
                    <div className="chapter-content">
                      {section.outline && (
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {section.outline}
                        </ReactMarkdown>
                      )}
                      {section.detail && (
                        <div>
                          <h3>细纲</h3>
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {section.detail}
                          </ReactMarkdown>
                        </div>
                      )}
                      {section.output ? (
                        <div>
                          <h3>正文</h3>
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {section.output}
                          </ReactMarkdown>
                        </div>
                      ) : Object.keys(outputSections).length > 0 ? (
                        <div>
                          <h3>正文</h3>
                          <p>（待生成）</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="preview-full-document">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {fullDocument}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <Danmaku content={danmakuContent} isNew={isNewDanmaku} />

      <div className="preview-footer">
        {hasUnfinishedDetail && (
          <button className="preview-continue" onClick={handleContinueGeneration}>
            <Play size={16} className="btn-icon" />
            继续生成细纲
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