import { useState } from 'react'
import type { CourseWithId } from '../../types'
import { recordMissedQuestion, saveQuizResult } from '../../lib/storage'
import { Markdown } from '../Markdown'

interface Answer {
  questionId: string
  question: string
  selectedId: string
  correct: boolean
}

export function QuizTab({ course }: { course: CourseWithId }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [finished, setFinished] = useState(false)

  const quiz = course.quiz

  if (quiz.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400">Aucune question de quiz pour ce cours.</p>
  }

  const question = quiz[index]
  const total = quiz.length
  const answered = selected !== null

  function reset() {
    setIndex(0)
    setSelected(null)
    setAnswers([])
    setFinished(false)
  }

  function choose(optionId: string) {
    if (answered) return
    const correct = optionId === question.correct
    setSelected(optionId)
    if (!correct) {
      recordMissedQuestion(course.id, question.id, question.question)
    }
    setAnswers((prev) => [
      ...prev,
      { questionId: question.id, question: question.question, selectedId: optionId, correct },
    ])
  }

  function next() {
    if (index + 1 >= total) {
      const score = answers.filter((a) => a.correct).length
      saveQuizResult(course.id, score, total)
      setFinished(true)
    } else {
      setIndex(index + 1)
      setSelected(null)
    }
  }

  if (finished) {
    const score = answers.filter((a) => a.correct).length
    const missed = answers.filter((a) => !a.correct)
    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-1 text-xl font-bold">Résultat</h2>
        <p className="mb-6 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {score} / {total}
        </p>

        {missed.length > 0 ? (
          <div>
            <h3 className="mb-2 font-semibold">Questions ratées</h3>
            <ul className="space-y-2">
              {missed.map((a) => (
                <li
                  key={a.questionId}
                  className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm dark:border-rose-900 dark:bg-rose-950/40"
                >
                  <Markdown className="inline [&_p]:m-0 [&_p]:inline">{a.question}</Markdown>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-emerald-600 dark:text-emerald-400">Sans faute, bravo !</p>
        )}

        <button
          onClick={reset}
          className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Recommencer
        </button>
      </div>
    )
  }

  const isCorrectOption = (optionId: string) => optionId === question.correct
  const isSelected = (optionId: string) => optionId === selected

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Question {index + 1} / {total}
          </span>
          <span>{answers.filter((a) => a.correct).length} bonnes réponses</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-4 text-lg font-medium">
        <Markdown>{question.question}</Markdown>
      </div>

      <div className="space-y-2">
        {question.options.map((option) => {
          let stateClasses =
            'border-slate-200 hover:border-indigo-400 dark:border-slate-700 dark:hover:border-indigo-500'
          if (answered) {
            if (isCorrectOption(option.id)) {
              stateClasses =
                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
            } else if (isSelected(option.id)) {
              stateClasses = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40'
            } else {
              stateClasses = 'border-slate-200 opacity-60 dark:border-slate-700'
            }
          }
          return (
            <button
              key={option.id}
              onClick={() => choose(option.id)}
              disabled={answered}
              className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors ${stateClasses}`}
            >
              <Markdown className="inline [&_p]:m-0 [&_p]:inline">{option.text}</Markdown>
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-100 p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
          <p className={`mb-1 font-semibold ${selected === question.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {selected === question.correct ? 'Bonne réponse !' : 'Mauvaise réponse'}
          </p>
          <Markdown className="text-slate-600 dark:text-slate-300">{question.explanation}</Markdown>
          <button
            onClick={next}
            className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            {index + 1 >= total ? 'Voir le résultat' : 'Question suivante'}
          </button>
        </div>
      )}
    </div>
  )
}
