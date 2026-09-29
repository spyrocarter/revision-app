import type { CourseWithId } from '../../types'
import { getAllMissedQuestions, clearMissedQuestion } from '../../lib/storage'
import { Markdown } from '../Markdown'
import { useState } from 'react'

interface SuiviTabProps {
  course: CourseWithId
  allCourses: CourseWithId[]
}

export function SuiviTab({ course, allCourses }: SuiviTabProps) {
  const [, forceRerender] = useState(0)
  const missedByCourse = getAllMissedQuestions()

  const byMatiere: Record<
    string,
    { courseId: string; sujet: string; questionId: string; question: string; missedCount: number }[]
  > = {}

  for (const c of allCourses) {
    const missed = missedByCourse[c.id]
    if (!missed) continue
    for (const [questionId, info] of Object.entries(missed)) {
      ;(byMatiere[c.matiere] ??= []).push({
        courseId: c.id,
        sujet: c.sujet,
        questionId,
        question: info.question,
        missedCount: info.missedCount,
      })
    }
  }

  const matieres = Object.keys(byMatiere).sort((a, b) => a.localeCompare(b))

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <h2 className="mb-2 text-lg font-semibold">Suivi de ce cours</h2>
        {course.suivi.trim() ? (
          <Markdown stabiloScope="suivi">{course.suivi}</Markdown>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">Aucune note de suivi pour ce cours.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Points faibles récurrents (tous les cours)</h2>
        {matieres.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            Aucune question ratée pour l'instant. Fais des quiz pour voir apparaître ici tes points à travailler.
          </p>
        ) : (
          <div className="space-y-5">
            {matieres.map((matiere) => (
              <div key={matiere}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {matiere}
                </h3>
                <ul className="space-y-2">
                  {byMatiere[matiere]
                    .sort((a, b) => b.missedCount - a.missedCount)
                    .map((item) => (
                      <li
                        key={`${item.courseId}-${item.questionId}`}
                        className="flex items-start justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm dark:border-rose-900 dark:bg-rose-950/40"
                      >
                        <div>
                          <Markdown className="[&_p]:m-0">{item.question}</Markdown>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {item.sujet} · raté {item.missedCount}×
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            clearMissedQuestion(item.courseId, item.questionId)
                            forceRerender((n) => n + 1)
                          }}
                          className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="Marquer comme maîtrisée"
                        >
                          Maîtrisée
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
