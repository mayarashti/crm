import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import TelegramBot from 'node-telegram-bot-api'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, 'server-data.json')

// ── Data helpers ─────────────────────────────────────────────────────────────
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return { courses: [], tasks: [] }
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── Express REST API (React app syncs here) ──────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/data', (_req, res) => res.json(readData()))

app.post('/api/data', (req, res) => {
  const { courses, tasks } = req.body ?? {}
  if (Array.isArray(courses) && Array.isArray(tasks)) {
    writeData({ courses, tasks })
  }
  res.sendStatus(200)
})

app.listen(3001, () => console.log('✅  API server → http://localhost:3001'))

// ── Gemini setup ─────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY)
const MODEL  = process.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'add_task',
        description: 'הוסף משימה חדשה לרשימת המשימות',
        parameters: {
          type: 'object',
          properties: {
            title:    { type: 'string',  description: 'שם המשימה' },
            courseId: { type: 'string',  description: 'מזהה הקורס (id). ריק אם לא צוין.' },
            priority: { type: 'string',  enum: ['high', 'medium', 'low'] },
            deadline: { type: 'string',  description: 'תאריך יעד YYYY-MM-DD. ריק אם לא צוין.' },
          },
          required: ['title', 'priority'],
        },
      },
      {
        name: 'toggle_task',
        description: 'סמן משימה כהושלמה, או בטל סימון אם כבר הושלמה',
        parameters: {
          type: 'object',
          properties: { taskId: { type: 'string', description: 'מזהה המשימה (id)' } },
          required: ['taskId'],
        },
      },
      {
        name: 'delete_task',
        description: 'מחק משימה לצמיתות',
        parameters: {
          type: 'object',
          properties: { taskId: { type: 'string', description: 'מזהה המשימה (id)' } },
          required: ['taskId'],
        },
      },
    ],
  },
]

function buildSystemPrompt({ courses, tasks }) {
  const today      = new Date().toISOString().split('T')[0]
  const coursesStr = courses.length === 0
    ? '  (אין קורסים)'
    : courses.map(c => `  • "${c.name}" | id: ${c.id}`).join('\n')
  const tasksStr = tasks.length === 0
    ? '  (אין משימות)'
    : tasks.map(t => {
        const cName  = courses.find(c => c.id === t.courseId)?.name || 'ללא קורס'
        const status = t.completed ? '✓ הושלם' : '○ פתוח'
        return `  • id:${t.id} | "${t.title}" | קורס: ${cName} (courseId:${t.courseId || ''}) | עדיפות: ${t.priority} | דדליין: ${t.deadline || 'ללא'} | ${status}`
      }).join('\n')

  return `אתה עוזר AI אישי עבור אפליקציית CRM לניהול לימודים של סטודנט.
ענה תמיד בעברית, בצורה תמציתית וידידותית. אל תפרט מידי.
תאריך היום: ${today}

═══ נתוני המשתמש (עדכני) ═══
קורסים:
${coursesStr}

משימות:
${tasksStr}

═══ הנחיות ═══
• כשמבקשים פעולה — השתמש בפונקציה המתאימה עם ה-id המדויק.
• כששואלים שאלה — ענה ישירות מהנתונים ללא קריאת פונקציה.
• אחרי ביצוע פעולה — אשר בקצרה מה נעשה.`
}

// Tool executor for Telegram (reads/writes server-data.json directly)
function executeToolCall(name, args) {
  const data = readData()
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
      data.tasks.push(task)
      writeData(data)
      const cName = data.courses.find(c => c.id === args.courseId)?.name
      return { success: true, taskId: task.id, message: `נוספה: "${args.title}"${cName ? ` ל${cName}` : ''}` }
    }
    case 'toggle_task': {
      const task = data.tasks.find(t => t.id === args.taskId)
      if (!task) return { success: false, message: 'משימה לא נמצאה' }
      task.completed = !task.completed
      writeData(data)
      return { success: true, message: `"${task.title}" ${task.completed ? 'סומנה כהושלמה' : 'בוטלה'}` }
    }
    case 'delete_task': {
      const task = data.tasks.find(t => t.id === args.taskId)
      if (!task) return { success: false, message: 'משימה לא נמצאה' }
      data.tasks = data.tasks.filter(t => t.id !== args.taskId)
      writeData(data)
      return { success: true, message: `"${task.title}" נמחקה` }
    }
    default:
      return { success: false, message: `פונקציה לא ידועה: ${name}` }
  }
}

// Per-chat conversation history (in-memory, resets on server restart)
const chatHistories = new Map()

async function askGemini(chatId, userText) {
  const data    = readData()
  const history = chatHistories.get(chatId) || []

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemPrompt(data),
    tools: TOOLS,
  })

  // Build alternating user/model history
  const geminiHistory = history.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
  while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') geminiHistory.shift()

  const chat = model.startChat({ history: geminiHistory })
  let result   = await chat.sendMessage(userText)
  let response = result.response

  // Function-calling loop
  for (let round = 0; round < 5; round++) {
    const calls = response.functionCalls?.() ?? []
    if (!calls.length) break
    const toolParts = calls.map(call => {
      try {
        const res = executeToolCall(call.name, call.args)
        return { functionResponse: { name: call.name, response: { result: res } } }
      } catch (err) {
        return { functionResponse: { name: call.name, response: { error: err.message } } }
      }
    })
    result   = await chat.sendMessage(toolParts)
    response = result.response
  }

  const replyText = response.text()

  // Save to history (keep last 20 turns to avoid bloated prompts)
  const updated = [
    ...history,
    { role: 'user',  text: userText  },
    { role: 'model', text: replyText },
  ].slice(-20)
  chatHistories.set(chatId, updated)

  return replyText
}

// ── Telegram Bot (polling) ───────────────────────────────────────────────────
const bot = new TelegramBot(process.env.TELEGRAM_BOT, { polling: true })

bot.on('message', async msg => {
  const chatId = msg.chat.id
  const text   = msg.text
  if (!text) return

  if (text === '/start') {
    await bot.sendMessage(
      chatId,
      'שלום! 👋 אני עוזר ה-AI שלך לניהול לימודים.\n\n' +
      'אני רואה את הקורסים והמשימות שלך ויכול:\n' +
      '• לענות על שאלות (מה הכי דחוף? איזה קורס עמוס?)\n' +
      '• להוסיף משימות\n' +
      '• לסמן משימות כהושלמות\n' +
      '• למחוק משימות\n\n' +
      'מה תרצה לדעת?'
    )
    return
  }

  await bot.sendChatAction(chatId, 'typing')

  try {
    const reply = await askGemini(chatId, text)
    // Try Markdown first, fall back to plain text
    try {
      await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' })
    } catch {
      await bot.sendMessage(chatId, reply)
    }
  } catch (err) {
    console.error('Gemini error for chat', chatId, err.message)
    await bot.sendMessage(chatId, '❌ אירעה שגיאה. נסה שוב.')
  }
})

bot.on('polling_error', err => console.error('Telegram polling error:', err.message))

console.log('🤖  Telegram bot (studybot) started — polling Telegram...')
