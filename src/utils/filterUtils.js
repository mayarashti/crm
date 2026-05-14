import { isToday, isUpcoming } from './dateUtils'

export function filterTasks(tasks, filter) {
  switch (filter) {
    case 'today':
      return tasks.filter(t => !t.completed && isToday(t.deadline))
    case 'upcoming':
      return tasks.filter(t => !t.completed && isUpcoming(t.deadline))
    case 'completed':
      return tasks.filter(t => t.completed)
    case 'urgent':
      return tasks.filter(t => !t.completed && t.priority === 'high')
    default:
      return tasks
  }
}
