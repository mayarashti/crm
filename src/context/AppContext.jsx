import { createContext, useContext, useReducer, useEffect, useRef } from 'react'

const API  = 'http://localhost:3001/api/data'
const KEYS = { courses: 'crm_courses', tasks: 'crm_tasks' }

function load() {
  try {
    return {
      courses: JSON.parse(localStorage.getItem(KEYS.courses) || '[]'),
      tasks:   JSON.parse(localStorage.getItem(KEYS.tasks)   || '[]'),
    }
  } catch {
    return { courses: [], tasks: [] }
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return action.payload
    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.payload] }
    case 'UPDATE_COURSE':
      return { ...state, courses: state.courses.map(c => c.id === action.payload.id ? action.payload : c) }
    case 'DELETE_COURSE':
      return {
        ...state,
        courses: state.courses.filter(c => c.id !== action.payload),
        tasks:   state.tasks.filter(t => t.courseId !== action.payload),
      }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] }
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) }
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload ? { ...t, completed: !t.completed } : t),
      }
    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)
  // Tracks the last JSON string we synced so we can avoid push↔pull loops
  const lastSyncedRef = useRef(null)

  // 1. Always persist to localStorage
  useEffect(() => {
    localStorage.setItem(KEYS.courses, JSON.stringify(state.courses))
    localStorage.setItem(KEYS.tasks,   JSON.stringify(state.tasks))
  }, [state])

  // 2. Push every state change to the server (fire and forget)
  useEffect(() => {
    const snapshot = JSON.stringify(state)
    if (lastSyncedRef.current === snapshot) return   // came from server — don't echo back
    lastSyncedRef.current = snapshot
    fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    snapshot,
    }).catch(() => {})  // server may not be running — that's fine
  }, [state])

  // 3. Pull from server on startup, then poll every 5 s to catch bot updates
  useEffect(() => {
    let mounted = true

    async function pull() {
      try {
        const res = await fetch(API)
        if (!res.ok || !mounted) return
        const data     = await res.json()
        const snapshot = JSON.stringify(data)
        if (snapshot !== lastSyncedRef.current) {
          lastSyncedRef.current = snapshot
          dispatch({ type: 'LOAD', payload: data })
        }
      } catch {
        // server not running — localStorage data already loaded
      }
    }

    pull()
    const id = setInterval(pull, 5000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
