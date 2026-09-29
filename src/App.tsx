import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { CourseView } from './components/CourseView'
import { courses, matiereGroups, getCourse } from './lib/courses'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const [selectedId, setSelectedId] = useState<string | undefined>(courses[0]?.id)
  const { theme, toggleTheme } = useTheme()

  const selectedCourse = selectedId ? getCourse(selectedId) : undefined

  return (
    <div className="flex h-screen">
      <Sidebar
        matiereGroups={matiereGroups}
        selectedId={selectedId}
        onSelect={setSelectedId}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="flex-1 overflow-hidden">
        {selectedCourse ? (
          <CourseView course={selectedCourse} allCourses={courses} />
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
