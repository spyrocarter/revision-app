import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { legacyCourseIds } from './lib/courses'
import { migrateCourseIds } from './lib/storage'

migrateCourseIds(legacyCourseIds)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
