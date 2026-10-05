import type { Course, CourseWithId } from '../types'

const modules = import.meta.glob('/courses/**/*.json', { eager: true }) as Record<
  string,
  { default: Course }
>

// courses/GIM/x.json -> id "GIM/x", filière "GIM". Files directly in courses/ have no filière
// and are shown to everyone.
function parsePath(path: string): { id: string; filiere: string | null } {
  const id = path.replace(/^\/courses\//, '').replace(/\.json$/, '')
  const slash = id.indexOf('/')
  return { id, filiere: slash === -1 ? null : id.slice(0, slash) }
}

export const courses: CourseWithId[] = Object.entries(modules).map(([path, mod]) => ({
  ...mod.default,
  ...parsePath(path),
}))

export const filieres: string[] = [...new Set(courses.map((c) => c.filiere).filter((f) => f !== null))].sort(
  (a, b) => a.localeCompare(b, 'fr'),
)

export function coursesForFiliere(filiere: string | null): CourseWithId[] {
  if (filiere === null) return courses
  return courses.filter((c) => c.filiere === filiere || c.filiere === null)
}

// Progress used to be stored under the bare file name, before courses moved into filière folders.
export const legacyCourseIds: Record<string, string> = (() => {
  const byName = new Map<string, string[]>()
  for (const c of courses) {
    const name = c.id.split('/').pop() ?? c.id
    if (name !== c.id) byName.set(name, [...(byName.get(name) ?? []), c.id])
  }
  const map: Record<string, string> = {}
  for (const [name, ids] of byName) if (ids.length === 1) map[name] = ids[0]
  return map
})()

export interface MatiereGroup {
  matiere: string
  courses: CourseWithId[]
}

// "Matériaux (UEF MATI – GIM1)" and "Materiaux" both group under "Matériaux":
// parenthesised details (UE code, class, year) vary from one course file to another.
function matiereLabel(matiere: string): string {
  return matiere.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim() || matiere.trim()
}

function normalizeMatiere(matiere: string): string {
  return matiereLabel(matiere).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function groupByMatiere(list: CourseWithId[]): MatiereGroup[] {
  const groups = new Map<string, MatiereGroup>()
  for (const course of list) {
    const key = normalizeMatiere(course.matiere)
    const group = groups.get(key)
    if (group) group.courses.push(course)
    else groups.set(key, { matiere: matiereLabel(course.matiere), courses: [course] })
  }
  for (const group of groups.values()) {
    group.courses.sort((a, b) => a.sujet.localeCompare(b.sujet, 'fr', { numeric: true }))
  }
  return [...groups.values()].sort((a, b) => a.matiere.localeCompare(b.matiere, 'fr'))
}
