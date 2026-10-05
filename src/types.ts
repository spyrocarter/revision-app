export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
  correct: string
  explanation: string
}

export interface Flashcard {
  id: string
  recto: string
  verso: string
}

export interface Exercice {
  titre: string
  difficulte: number
  enonce: string
  corrige: string
}

export interface Course {
  matiere: string
  type: string
  sujet: string
  fiche_synthese: string
  quiz: QuizQuestion[]
  flashcards: Flashcard[]
  exercices: Exercice[]
  suivi: string
}

export interface CourseWithId extends Course {
  id: string
  filiere: string | null
}

export type FlashcardStatus = 'a_revoir' | 'acquise'
