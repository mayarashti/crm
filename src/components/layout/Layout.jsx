import Header from './Header'
import ChatWidget from '../chat/ChatWidget'

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <ChatWidget />
    </div>
  )
}
