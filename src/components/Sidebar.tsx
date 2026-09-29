import type { MatiereGroup } from '../lib/courses'

interface SidebarProps {
  matiereGroups: MatiereGroup[]
  selectedId: string | undefined
  onSelect: (id: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

const typeStyles: Record<string, string> = {
  CM: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  TD: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  TP: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
}

export function Sidebar({ matiereGroups, selectedId, onSelect, theme, onToggleTheme }: SidebarProps) {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <h1 className="text-lg font-bold">Révisions</h1>
        <button
          onClick={onToggleTheme}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Changer de thème"
          title="Changer de thème"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {matiereGroups.length === 0 && (
          <p className="px-2 py-4 text-sm text-slate-500 dark:text-slate-400">
            Aucun cours trouvé dans <code className="font-mono">courses/</code>.
          </p>
        )}
        {matiereGroups.map(({ matiere, courses }) => (
          <div key={matiere} className="mb-4">
            <h2 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {matiere}
            </h2>
            <ul className="space-y-0.5">
              {courses.map((course) => (
                <li key={course.id}>
                  <button
                    onClick={() => onSelect(course.id)}
                    className={`w-full rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      selectedId === course.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          selectedId === course.id ? 'bg-white/20 text-white' : (typeStyles[course.type] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')
                        }`}
                      >
                        {course.type}
                      </span>
                      <span className="truncate">{course.sujet}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
