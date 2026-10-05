import { useMemo, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { CourseView } from './components/CourseView'
import { coursesForFiliere, filieres, groupByMatiere } from './lib/courses'
import { getCourseIdsWithProgress, getFilierePreference, setFilierePreference } from './lib/storage'
import { useTheme } from './hooks/useTheme'

// null with several filières means "not chosen yet": the visitor picks once.
function initialFiliere(): string | null {
  const stored = getFilierePreference()
  if (stored && filieres.includes(stored)) return stored
  if (filieres.length <= 1) return filieres[0] ?? null
  const counts = new Map<string, number>()
  for (const id of getCourseIdsWithProgress()) {
    const f = id.split('/')[0]
    if (filieres.includes(f)) counts.set(f, (counts.get(f) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

function firstCourseId(filiere: string | null): string | undefined {
  return groupByMatiere(coursesForFiliere(filiere))[0]?.courses[0]?.id
}

export default function App() {
  const [filiere, setFiliere] = useState<string | null>(initialFiliere)
  const [selectedId, setSelectedId] = useState<string | undefined>(() => firstCourseId(initialFiliere()))
  const { theme, toggleTheme } = useTheme()

  const mustChoose = filieres.length > 1 && filiere === null
  const visibleCourses = useMemo(() => (mustChoose ? [] : coursesForFiliere(filiere)), [mustChoose, filiere])
  const matiereGroups = useMemo(() => groupByMatiere(visibleCourses), [visibleCourses])
  const selectedCourse = visibleCourses.find((c) => c.id === selectedId)

  function changeFiliere(next: string) {
    setFiliere(next)
    setFilierePreference(next)
    setSelectedId(firstCourseId(next))
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        filieres={filieres}
        filiere={filiere}
        onFiliereChange={changeFiliere}
        matiereGroups={matiereGroups}
        selectedId={selectedId}
        onSelect={setSelectedId}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="flex-1 overflow-hidden">
        {mustChoose ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="mb-6 text-2xl font-bold">Quelle est ta filière ?</p>
              <div className="flex justify-center gap-4">
                {filieres.map((f) => (
                  <button
                    key={f}
                    onClick={() => changeFiliere(f)}
                    className="min-w-32 rounded-xl border-2 border-slate-200 bg-white px-8 py-5 text-2xl font-bold text-indigo-600 shadow-sm transition hover:border-indigo-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-400"
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                Tu pourras changer à tout moment en haut de la barre latérale.
              </p>
            </div>
          </div>
        ) : selectedCourse ? (
          <CourseView course={selectedCourse} allCourses={visibleCourses} />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <p className="mb-2 text-lg font-medium">Aucun cours sélectionné</p>
              <p className="text-sm">
                Ajoute des fichiers .json dans le dossier <code className="font-mono">courses/</code> puis relance
                le serveur de dev.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
