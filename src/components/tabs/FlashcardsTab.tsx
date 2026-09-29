import { useEffect, useState } from 'react'
import type { CourseWithId, FlashcardStatus } from '../../types'
import { getFlashcardStatuses, setFlashcardStatus } from '../../lib/storage'
import { Markdown } from '../Markdown'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const statusLabel: Record<FlashcardStatus, string> = {
  a_revoir: 'À revoir',
  acquise: 'Acquise',
}

const statusStyle: Record<FlashcardStatus, string> = {
  a_revoir: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  acquise: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
}

export function FlashcardsTab({ course }: { course: CourseWithId }) {
  const [order, setOrder] = useState(course.flashcards)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, FlashcardStatus>>(() =>
    getFlashcardStatuses(course.id),
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const cards = order
  if (cards.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400">Aucune flashcard pour ce cours.</p>
  }

  const card = cards[index]

  function go(delta: number) {
    setFlipped(false)
    setIndex((i) => (i + delta + cards.length) % cards.length)
  }

  function mark(status: FlashcardStatus) {
    setFlashcardStatus(course.id, card.id, status)
    setStatuses((prev) => ({ ...prev, [card.id]: status }))
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center">
      <div className="mb-3 flex w-full items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          Carte {index + 1} / {cards.length}
        </span>
        <button
          onClick={() => {
            setOrder(shuffle(course.flashcards))
            setIndex(0)
            setFlipped(false)
          }}
          className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Mélanger
        </button>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[16rem] w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-colors hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
      >
        <Markdown className="text-lg">{flipped ? card.verso : card.recto}</Markdown>
      </button>
      <p className="mt-2 text-xs text-slate-400">Clique sur la carte ou appuie sur espace pour la retourner</p>

      {statuses[card.id] && (
        <span className={`mt-3 rounded px-2 py-0.5 text-xs font-medium ${statusStyle[statuses[card.id]]}`}>
          {statusLabel[statuses[card.id]]}
        </span>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => mark('a_revoir')}
          className="rounded-md border border-amber-300 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
        >
          À revoir
        </button>
        <button
          onClick={() => mark('acquise')}
          className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
        >
          Acquise
        </button>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => go(-1)}
          className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          ← Précédent
        </button>
        <button
          onClick={() => go(1)}
          className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          Suivant →
        </button>
      </div>
    </div>
  )
}
