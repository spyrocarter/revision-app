import type { FlashcardStatus } from '../types'

const PREFIX = 'revision-app:v1:'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // localStorage indisponible (mode privé, quota, etc.) : on ignore silencieusement
  }
}

// --- Scores de quiz ---

export interface QuizResult {
  score: number
  total: number
  lastAttempt: string
}

export function getQuizResult(courseId: string): QuizResult | undefined {
  return read<Record<string, QuizResult>>('quizResults', {})[courseId]
}

export function saveQuizResult(courseId: string, score: number, total: number): void {
  const all = read<Record<string, QuizResult>>('quizResults', {})
  all[courseId] = { score, total, lastAttempt: new Date().toISOString() }
  write('quizResults', all)
}

// --- Questions ratées ---

export interface MissedQuestion {
  question: string
  missedCount: number
  lastMissedAt: string
}

type MissedQuestionsByCourse = Record<string, Record<string, MissedQuestion>>

export function getAllMissedQuestions(): MissedQuestionsByCourse {
  return read<MissedQuestionsByCourse>('missedQuestions', {})
}

export function getMissedQuestions(courseId: string): Record<string, MissedQuestion> {
  return getAllMissedQuestions()[courseId] ?? {}
}

export function recordMissedQuestion(
  courseId: string,
  questionId: string,
  questionText: string,
): void {
  const all = getAllMissedQuestions()
  const courseMap = all[courseId] ?? {}
  const existing = courseMap[questionId]
  courseMap[questionId] = {
    question: questionText,
    missedCount: (existing?.missedCount ?? 0) + 1,
    lastMissedAt: new Date().toISOString(),
  }
  all[courseId] = courseMap
  write('missedQuestions', all)
}

export function clearMissedQuestion(courseId: string, questionId: string): void {
  const all = getAllMissedQuestions()
  const courseMap = all[courseId]
  if (!courseMap) return
  delete courseMap[questionId]
  if (Object.keys(courseMap).length === 0) {
    delete all[courseId]
  } else {
    all[courseId] = courseMap
  }
  write('missedQuestions', all)
}

// --- Statut des flashcards ---

type FlashcardStatuses = Record<string, Record<string, FlashcardStatus>>

export function getFlashcardStatuses(courseId: string): Record<string, FlashcardStatus> {
  return read<FlashcardStatuses>('flashcardStatus', {})[courseId] ?? {}
}

export function setFlashcardStatus(
  courseId: string,
  flashcardId: string,
  status: FlashcardStatus,
): void {
  const all = read<FlashcardStatuses>('flashcardStatus', {})
  all[courseId] = { ...(all[courseId] ?? {}), [flashcardId]: status }
  write('flashcardStatus', all)
}

// --- Préférence de thème ---

export function getThemePreference(): 'light' | 'dark' | undefined {
  return read<'light' | 'dark' | undefined>('theme', undefined)
}

export function setThemePreference(theme: 'light' | 'dark'): void {
  write('theme', theme)
}

// --- Surlignages (stabilo) ---

export type StabiloColor = 'yellow' | 'green' | 'pink' | 'blue'

export interface StabiloMark {
  start: number
  end: number
  color: StabiloColor
  text: string
}

type StabiloStore = Record<string, Record<string, StabiloMark[]>>

export function getStabiloMarks(courseId: string): Record<string, StabiloMark[]> {
  return read<StabiloStore>('stabilo', {})[courseId] ?? {}
}

export function saveStabiloMarks(courseId: string, marksByScope: Record<string, StabiloMark[]>): void {
  const all = read<StabiloStore>('stabilo', {})
  all[courseId] = marksByScope
  write('stabilo', all)
}

// --- Filière choisie (GIM, GIE…) ---

export function getFilierePreference(): string | undefined {
  return read<string | undefined>('filiere', undefined)
}

export function setFilierePreference(filiere: string): void {
  write('filiere', filiere)
}

// --- Migration des identifiants de cours ---

const COURSE_KEYED_STORES = ['quizResults', 'missedQuestions', 'flashcardStatus', 'stabilo']

export function getCourseIdsWithProgress(): string[] {
  return COURSE_KEYED_STORES.flatMap((key) => Object.keys(read<Record<string, unknown>>(key, {})))
}

export function migrateCourseIds(renames: Record<string, string>): void {
  for (const key of COURSE_KEYED_STORES) {
    const store = read<Record<string, unknown>>(key, {})
    let changed = false
    for (const [from, to] of Object.entries(renames)) {
      if (from in store && !(to in store)) {
        store[to] = store[from]
        delete store[from]
        changed = true
      }
    }
    if (changed) write(key, store)
  }
}
