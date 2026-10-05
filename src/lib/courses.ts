import type { Course, CourseWithId } from '../types'

const modules = import.meta.glob('/courses/*.json', { eager: true }) as Record<
  string,
  { default: Course }
>

function idFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.json$/, '')
}

export const courses: CourseWithId[] = Object.entries(modules)
  .map(([path, mod]) => ({ id: idFromPath(path), ...mod.default }))
  .sort((a, b) => a.matiere.localeCompare(b.matiere) || a.sujet.localeCompare(b.sujet))

export function getCourse(id: string): CourseWithId | undefined {
  return courses.find((c) => c.id === id)
}

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

const groupsByKey = new Map<string, MatiereGroup>()
for (const course of courses) {
  const key = normalizeMatiere(course.matiere)
  const group = groupsByKey.get(key)
  if (group) {
    group.courses.push(course)
  } else {
    groupsByKey.set(key, { matiere: matiereLabel(course.matiere), courses: [course] })
  }
}

for (const group of groupsByKey.values()) {
  group.courses.sort((a, b) => a.sujet.localeCompare(b.sujet, 'fr', { numeric: true }))
}

export const matiereGroups: MatiereGroup[] = Array.from(groupsByKey.values()).sort((a, b) =>
  a.matiere.localeCompare(b.matiere, 'fr'),
)
