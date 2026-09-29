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

function normalizeMatiere(matiere: string): string {
  return matiere.trim().toLowerCase()
}

const groupsByKey = new Map<string, MatiereGroup>()
for (const course of courses) {
  const key = normalizeMatiere(course.matiere)
  const group = groupsByKey.get(key)
  if (group) {
    group.courses.push(course)
  } else {
    groupsByKey.set(key, { matiere: course.matiere.trim(), courses: [course] })
  }
}

export const matiereGroups: MatiereGroup[] = Array.from(groupsByKey.values()).sort((a, b) =>
  a.matiere.localeCompare(b.matiere),
)
