import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL   = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'

const genAI = new GoogleGenerativeAI(API_KEY)

// ── Tool definitions ────────────────────────────────────────────────────────
const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'add_task',
        description: 'הוסף משימה חדשה לרשימת המשימות של המשתמש',
        parameters: {
          type: 'object',
          properties: {
            title:    { type: 'string', description: 'שם המשימה' },
            courseId: { type: 'string', description: 'מזהה הקורס (id) שאליו שייכת המשימה. ריק אם לא צוין.' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'עדיפות: high=גבוהה, medium=בינונית, low=נמוכה' },
            deadline: { type: 'string', description: 'תאריך יעד בפורמט YYYY-MM-DD. ריק אם לא צוין.' },
          },
          required: ['title', 'priority'],
        },
      },
      {
        name: 'toggle_task',
        description: 'שנה מצב משימה — סמן כהושלמה אם פתוחה, או בטל סימון אם הושלמה',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'מזהה המשימה (id)' },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'delete_task',
        description: 'מחק משימה לצמיתות',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'מזהה המשימה (id)' },
          },
          required: ['taskId'],
        },
      },
    ],
  },
]

// ── System prompt with live app data injected ───────────────────────────────
function buildSystemPrompt({ courses, tasks }) {
  const today = new Date().toISOString().split('T')[0]

  const coursesStr = courses.length === 0
    ? '  (אין קורסים)'
    : courses.map(c => `  • "${c.name}" | id: ${c.id}`).join('\n')

  const tasksStr = tasks.length === 0
    ? '  (אין משימות)'
    : tasks.map(t => {
        const courseName = courses.find(c => c.id === t.courseId)?.name || 'ללא קורס'
        const status = t.completed ? '✓ הושלם' : '○ פתוח'
        return `  • id:${t.id} | "${t.title}" | קורס: ${courseName} (courseId:${t.courseId || ''}) | עדיפות: ${t.priority} | דדליין: ${t.deadline || 'ללא'} | ${status}`
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
• כשמבקשים פעולה (הוסף / סמן / מחק) — השתמש בפונקציה המתאימה עם ה-id המדויק.
• כששואלים שאלה — ענה ישירות מהנתונים ללא קריאת פונקציה.
• אחרי ביצוע פעולה — אשר בקצרה מה נעשה.`
}

// ── Converts chat history to Gemini's alternating user/model format ─────────
function buildGeminiHistory(history) {
  const result = history.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }))
  // Gemini requires history to start with a 'user' turn
  while (result.length > 0 && result[0].role === 'model') result.shift()
  return result
}

/**
 * Send a message to Gemini with live app context and function-calling support.
 *
 * @param {Array<{sender,text}>} history     Prior chat messages
 * @param {string}               userMessage The new user input
 * @param {{courses,tasks}}      context     Live snapshot from AppContext
 * @param {Function}             onToolCall  (name, args) => result — executes app actions
 * @returns {Promise<string>}    Gemini's final text reply
 */
export async function sendToGemini(history, userMessage, context, onToolCall) {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemPrompt(context),
    tools: TOOLS,
  })

  const chat = model.startChat({ history: buildGeminiHistory(history) })

  let result   = await chat.sendMessage(userMessage)
  let response = result.response

  // Function-calling loop (Gemini may chain multiple tool rounds)
  for (let round = 0; round < 5; round++) {
    const calls = response.functionCalls?.() ?? []
    if (!calls.length) break

    const toolParts = await Promise.all(
      calls.map(async call => {
        try {
          const res = await onToolCall(call.name, call.args)
          return { functionResponse: { name: call.name, response: { result: res } } }
        } catch (err) {
          return { functionResponse: { name: call.name, response: { error: err.message } } }
        }
      })
    )

    result   = await chat.sendMessage(toolParts)
    response = result.response
  }

  return response.text()
}
