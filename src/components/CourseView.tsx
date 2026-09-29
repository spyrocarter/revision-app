import { useEffect, useRef, useState } from 'react'
import type { CourseWithId } from '../types'
import { getQuizResult } from '../lib/storage'
import { FicheTab } from './tabs/FicheTab'
import { QuizTab } from './tabs/QuizTab'
import { FlashcardsTab } from './tabs/FlashcardsTab'
import { ExercicesTab } from './tabs/ExercicesTab'
import { SuiviTab } from './tabs/SuiviTab'
import { PageSearch } from './PageSearch'
import { Stabilo } from './Stabilo'

const TABS = ['Fiche', 'Quiz', 'Flashcards', 'Exercices', 'Suivi'] as const
type Tab = (typeof TABS)[number]

export function CourseView({ course, allCourses }: { course: CourseWithId; allCourses: CourseWithId[] }) {
  const [tab, setTab] = useState<Tab>('Fiche')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchFocus, setSearchFocus] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const lastScore = getQuizResult(course.id)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setSearchOpen(true)
        setSearchFocus((n) => n + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-full flex-col" key={course.id}>
      <header className="border-b border-slate-200 px-8 pb-4 pt-6 dark:border-slate-800">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          {course.matiere} · {course.type}
        </p>
        <h1 className="text-2xl font-bold">{course.sujet}</h1>
      </header>

      <nav className="flex items-center gap-1 border-b border-slate-200 px-6 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t}
            {t === 'Quiz' && lastScore && (
              <span className="ml-1.5 text-xs text-slate-400">
                ({lastScore.score}/{lastScore.total})
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto py-2">
          {searchOpen ? (
            <PageSearch containerRef={contentRef} focusSignal={searchFocus} onClose={() => setSearchOpen(false)} />
          ) : (
            <button
              onClick={() => {
                setSearchOpen(true)
                setSearchFocus((n) => n + 1)
              }}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Rechercher dans la page (⌘F / Ctrl+F)"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="m13 13 4 4" strokeLinecap="round" />
              </svg>
              Rechercher
            </button>
          )}
        </div>
      </nav>

      <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-6">
        {tab === 'Fiche' && <FicheTab course={course} />}
        {tab === 'Quiz' && <QuizTab course={course} key={course.id} />}
        {tab === 'Flashcards' && <FlashcardsTab course={course} key={course.id} />}
        {tab === 'Exercices' && <ExercicesTab course={course} />}
        {tab === 'Suivi' && <SuiviTab course={course} allCourses={allCourses} />}
      </div>
      <Stabilo containerRef={contentRef} courseId={course.id} />
    </div>
  )
}
