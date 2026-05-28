import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { sendToGemini } from '../../utils/gemini'
import { generateId } from '../../utils/dateUtils'
import './ChatWidget.css'

const STORAGE_KEY = 'crm_chat_messages'

const INITIAL_MESSAGES = [
  {
    id: 1,
    text: 'שלום! 👋 אני עוזר ה-AI שלך. אני רואה את הקורסים והמשימות שלך ויכול לענות על שאלות, להוסיף משימות, לסמן כהושלם ועוד.',
    sender: 'support',
    time: new Date().toISOString(),
  },
]

function loadMessages() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : INITIAL_MESSAGES
  } catch {
    return INITIAL_MESSAGES
  }
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatWidget() {
  const { state, dispatch }     = useApp()
  const [isOpen, setIsOpen]     = useState(false)
  const [messages, setMessages] = useState(loadMessages)
  const [input, setInput]       = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError]       = useState(null)
  const [unread, setUnread]     = useState(0)
  const messagesEndRef          = useRef(null)
  const inputRef                = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (!isOpen) setUnread(prev => prev + 1)
  }, [messages, isTyping])

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    // Snapshot of current app state for this request
    const courses = state.courses
    const tasks   = state.tasks

    // Handler that executes Gemini tool calls against the live app state
    function toolHandler(name, args) {
      switch (name) {
        case 'add_task': {
          const task = {
            id:        generateId(),
            title:     args.title,
            courseId:  args.courseId || '',
            priority:  args.priority || 'medium',
            deadline:  args.deadline || '',
            completed: false,
            createdAt: new Date().toISOString(),
          }
          dispatch({ type: 'ADD_TASK', payload: task })
          const courseName = courses.find(c => c.id === args.courseId)?.name
          return {
            success: true,
            taskId:  task.id,
            message: `משימה "${args.title}" נוספה${courseName ? ` לקורס ${courseName}` : ''}`,
          }
        }

        case 'toggle_task': {
          const task = tasks.find(t => t.id === args.taskId)
          if (!task) return { success: false, message: 'משימה לא נמצאה' }
          dispatch({ type: 'TOGGLE_TASK', payload: args.taskId })
          return {
            success: true,
            message: `משימה "${task.title}" ${task.completed ? 'בוטלה' : 'סומנה כהושלמה'}`,
          }
        }

        case 'delete_task': {
          const task = tasks.find(t => t.id === args.taskId)
          if (!task) return { success: false, message: 'משימה לא נמצאה' }
          dispatch({ type: 'DELETE_TASK', payload: args.taskId })
          return { success: true, message: `משימה "${task.title}" נמחקה` }
        }

        default:
          return { success: false, message: `פונקציה לא ידועה: ${name}` }
      }
    }

    const userMsg = {
      id:     Date.now(),
      text:   input.trim(),
      sender: 'user',
      time:   new Date().toISOString(),
    }

    const historySnapshot = [...messages]
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setError(null)
    setIsTyping(true)

    try {
      const reply = await sendToGemini(
        historySnapshot,
        userMsg.text,
        { courses, tasks },
        toolHandler,
      )
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: reply, sender: 'support', time: new Date().toISOString() },
      ])
    } catch (err) {
      console.error('Gemini error:', err)
      setError('שגיאה בתקשורת עם ה-AI. נסה שוב.')
    } finally {
      setIsTyping(false)
    }
  }

  function clearChat() {
    setMessages(INITIAL_MESSAGES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES))
    setError(null)
  }

  return (
    <div className="chat-widget" onKeyDown={e => e.key === 'Escape' && setIsOpen(false)}>
      {isOpen && (
        <div className="chat-panel" role="dialog" aria-label="צ'אט AI">

          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar"><MessageCircle size={18} /></div>
              <div>
                <div className="chat-name">עוזר AI</div>
                <div className="chat-online-dot-row">
                  <span className="chat-online-dot" />
                  <span className="chat-status">Gemini 2.5 Flash</span>
                </div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="icon-btn" onClick={clearChat} title="נקה שיחה">
                <Trash2 size={15} />
              </button>
              <button className="icon-btn" onClick={() => setIsOpen(false)} title="סגור">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                <div className="chat-bubble-wrap">
                  <div className="message-bubble">{msg.text}</div>
                  <div className="message-time">{formatTime(msg.time)}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message-row support">
                <div className="chat-bubble-wrap">
                  <div className="message-bubble typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            {error && <div className="chat-error">{error}</div>}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-row" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder="שאל את ה-AI..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || isTyping}
              title="שלח"
            >
              <Send size={15} />
            </button>
          </form>

        </div>
      )}

      <button
        className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? "סגור צ'אט" : "פתח צ'אט"}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {!isOpen && unread > 0 && (
          <span className="chat-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
    </div>
  )
}
