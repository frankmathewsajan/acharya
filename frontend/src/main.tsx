import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

function initReveal() {
  if ('IntersectionObserver' in window) {
    const elements = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    elements.forEach((el) => io.observe(el))
  } else {
    // Fallback
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'))
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Kick off reveal after initial render
requestAnimationFrame(() => initReveal())
