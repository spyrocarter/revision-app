import { useState } from 'react'
import type { CourseWithId } from '../../types'
import { Markdown } from '../Markdown'

const difficultyLabel = (d: number) => '●'.repeat(Math.max(1, Math.min(5, d))) + '○'.repeat(Math.max(0, 5 - d))

export function ExercicesTab({ course }: { course: CourseWithId }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  const exercices = [...course.exercices]
    .map((ex, originalIndex) => ({ ex, originalIndex }))
    .sort((a, b) => a.ex.difficulte - b.ex.difficulte)

  if (exercices.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400">Aucun exercice pour ce cours.</p>
  }

  function toggle(i: number) {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {exercices.map(({ ex, originalIndex }) => (
        <div
          key={originalIndex}
          className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">{ex.titre}</h3>
            <span className="font-mono text-sm text-indigo-500" title={`Difficulté ${ex.difficulte}/5`}>
              {difficultyLabel(ex.difficulte)}
            </span>
          </div>

          <Markdown stabiloScope={`exercice-${originalIndex}-enonce`}>{ex.enonce}</Markdown>

          {revealed.has(originalIndex) ? (
            <div className="mt-4 rounded-md border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                Corrigé
              </p>
              <Markdown stabiloScope={`exercice-${originalIndex}-corrige`}>{ex.corrige}</Markdown>
            </div>
          ) : (
            <button
              onClick={() => toggle(originalIndex)}
              className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Voir le corrigé
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
