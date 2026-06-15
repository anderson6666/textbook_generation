import { useEffect, useState, useRef } from 'react'

interface DanmakuItem {
  id: number
  text: string
  color: string
  top: number
}

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

function Danmaku({ content, isNew }: { content: string; isNew: boolean }) {
  const [danmakuList, setDanmakuList] = useState<DanmakuItem[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    if (isNew && content) {
      const truncated = content.length > 100 ? content.slice(0, 100) + '...' : content
      
      const newDanmaku: DanmakuItem = {
        id: idRef.current++,
        text: truncated,
        color: colors[Math.floor(Math.random() * colors.length)],
        top: Math.random() * 60 + 10
      }

      setDanmakuList(prev => [...prev, newDanmaku])

      setTimeout(() => {
        setDanmakuList(prev => prev.filter(item => item.id !== newDanmaku.id))
      }, 8000)
    }
  }, [content, isNew])

  return (
    <div className="danmaku-container">
      {danmakuList.map(item => (
        <div
          key={item.id}
          className="danmaku-item"
          style={{
            color: item.color,
            top: `${item.top}%`,
            animationDuration: `${8 + Math.random() * 4}s`
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  )
}

export default Danmaku