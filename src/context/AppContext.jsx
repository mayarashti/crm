import { createContext, useContext, useReducer, useEffect } from 'react'

const KEYS = { courses: 'crm_courses', tasks: 'crm_tasks' }

function load() {
  try {
    return {
      courses: JSON.parse(localStorage.getItem(KEYS.courses) || '[]'),
      tasks: JSON.parse(localStorage.getItem(KEYS.tasks) || '[]'),
    }
  } catch {
    return { courses: [], tasks: [] }
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.payload] }
    case 'UPDATE_COURSE':
      return { ...state, courses: state.courses.map(c => c.id === action.payload.id ? action.payload : c) }
    case 'DELETE_COURSE':
      return {
        ...state,
        courses: state.courses.filter(c => c.id !== action.payload),
        tasks: state.tasks.filter(t => t.courseId !== action.payload),
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

  useEffect(() => {
    localStorage.setItem(KEYS.courses, JSON.stringify(state.courses))
    localStorage.setItem(KEYS.tasks, JSON.stringify(state.tasks))
  }, [state])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
