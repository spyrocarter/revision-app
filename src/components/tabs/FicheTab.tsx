import { Markdown } from '../Markdown'
import type { CourseWithId } from '../../types'

export function FicheTab({ course }: { course: CourseWithId }) {
  if (!course.fiche_synthese.trim()) {
    return <p className="text-slate-500 dark:text-slate-400">Aucune fiche de synthèse pour ce cours.</p>
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Markdown stabiloScope="fiche">{course.fiche_synthese}</Markdown>
    </div>
  )
}
