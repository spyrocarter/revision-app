import { useEffect, useRef, useState, type RefObject } from 'react'
import { getStabiloMarks, saveStabiloMarks, type StabiloColor, type StabiloMark } from '../lib/storage'

const COLORS: { id: StabiloColor; label: string; swatch: string }[] = [
  { id: 'yellow', label: 'Jaune', swatch: 'bg-yellow-300' },
  { id: 'green', label: 'Vert', swatch: 'bg-lime-300' },
  { id: 'pink', label: 'Rose', swatch: 'bg-pink-300' },
  { id: 'blue', label: 'Bleu', swatch: 'bg-sky-300' },
]

const supportsHighlight = typeof CSS !== 'undefined' && 'highlights' in CSS

interface TextEntry {
  node: Text
  start: number
  end: number
  katex: Element | null
}

// Marks are stored as character offsets into the visible text of one scope (a Markdown block),
// so they survive re-renders without touching the DOM React and KaTeX own.
function readScope(scope: Element): { entries: TextEntry[]; text: string } {
  const entries: TextEntry[] = []
  let text = ''
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest('.katex-mathml') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  })
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const start = text.length
    text += node.data
    entries.push({ node, start, end: text.length, katex: node.parentElement?.closest('.katex') ?? null })
  }
  return { entries, text }
}

function pointToOffset(entries: TextEntry[], total: number, node: Node, offset: number): number {
  const probe = document.createRange()
  probe.setStart(node, offset)
  for (const e of entries) {
    if (e.node === node) return e.start + offset
    if (probe.comparePoint(e.node, 0) >= 0) return e.start
  }
  return total
}

function expandToFormulas(entries: TextEntry[], start: number, end: number): [number, number] {
  const touched = new Set<Element>()
  for (const e of entries) {
    if (e.katex && e.start < end && e.end > start) touched.add(e.katex)
  }
  let s = start
  let t = end
  for (const e of entries) {
    if (e.katex && touched.has(e.katex)) {
      s = Math.min(s, e.start)
      t = Math.max(t, e.end)
    }
  }
  return [s, t]
}

// Falls back to searching for the quoted text when the course file was edited and offsets moved.
function resolve(mark: StabiloMark, text: string): [number, number] | null {
  if (text.slice(mark.start, mark.end) === mark.text) return [mark.start, mark.end]
  const at = text.indexOf(mark.text)
  return at === -1 ? null : [at, at + mark.text.length]
}

function applyMark(
  marks: StabiloMark[],
  text: string,
  start: number,
  end: number,
  color: StabiloColor | null,
): StabiloMark[] {
  const next: StabiloMark[] = []
  for (const mark of marks) {
    const r = resolve(mark, text)
    if (!r || r[1] <= start || r[0] >= end) {
      next.push(mark)
      continue
    }
    if (r[0] < start) next.push({ ...mark, start: r[0], end: start, text: text.slice(r[0], start) })
    if (r[1] > end) next.push({ ...mark, start: end, end: r[1], text: text.slice(end, r[1]) })
  }
  if (color) next.push({ start, end, color, text: text.slice(start, end) })
  return next.sort((a, b) => a.start - b.start)
}

function paint(container: HTMLElement, marksByScope: Record<string, StabiloMark[]>) {
  container.querySelectorAll('.katex[data-stabilo]').forEach((el) => el.removeAttribute('data-stabilo'))
  const buckets: Record<StabiloColor, Range[]> = { yellow: [], green: [], pink: [], blue: [] }

  container.querySelectorAll<HTMLElement>('[data-stabilo-scope]').forEach((scope) => {
    const marks = marksByScope[scope.dataset.stabiloScope ?? '']
    if (!marks?.length) return
    const { entries, text } = readScope(scope)
    for (const mark of marks) {
      const r = resolve(mark, text)
      if (!r) continue
      for (const e of entries) {
        const a = Math.max(r[0], e.start)
        const b = Math.min(r[1], e.end)
        if (a >= b) continue
        if (e.katex) {
          e.katex.setAttribute('data-stabilo', mark.color)
          continue
        }
        const range = document.createRange()
        range.setStart(e.node, a - e.start)
        range.setEnd(e.node, b - e.start)
        buckets[mark.color].push(range)
      }
    }
  })

  if (!supportsHighlight) return
  for (const { id } of COLORS) CSS.highlights.set(`stabilo-${id}`, new Highlight(...buckets[id]))
}

function closestScope(node: Node): HTMLElement | null {
  const el = node instanceof Element ? node : node.parentElement
  return el?.closest<HTMLElement>('[data-stabilo-scope]') ?? null
}

function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  const pos = document.caretPositionFromPoint?.(x, y)
  if (pos) return { node: pos.offsetNode, offset: pos.offset }
  const range = document.caretRangeFromPoint?.(x, y)
  return range ? { node: range.startContainer, offset: range.startOffset } : null
}

interface Toolbar {
  scope: string
  start: number
  end: number
  x: number
  top: number
  bottom: number
  canErase: boolean
  current?: StabiloColor
}

interface StabiloProps {
  containerRef: RefObject<HTMLElement | null>
  courseId: string
}

export function Stabilo({ containerRef, courseId }: StabiloProps) {
  const [marks, setMarks] = useState<Record<string, StabiloMark[]>>(() => getStabiloMarks(courseId))
  const [toolbar, setToolbar] = useState<Toolbar | null>(null)
  const marksRef = useRef(marks)

  useEffect(() => {
    marksRef.current = marks
    if (containerRef.current) paint(containerRef.current, marks)
  }, [containerRef, marks])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Tab switches, revealed corrigés, etc. recreate the text nodes: repaint onto the new ones.
    const observer = new MutationObserver(() => paint(container, marksRef.current))
    observer.observe(container, { childList: true, subtree: true, characterData: true })
    const hide = () => setToolbar(null)
    container.addEventListener('scroll', hide)
    return () => {
      observer.disconnect()
      container.removeEventListener('scroll', hide)
      if (supportsHighlight) for (const { id } of COLORS) CSS.highlights.delete(`stabilo-${id}`)
    }
  }, [containerRef])

  useEffect(() => {
    function fromSelection(): Toolbar | null {
      const container = containerRef.current
      const selection = window.getSelection()
      if (!container || !selection || selection.isCollapsed || selection.rangeCount === 0) return null
      const range = selection.getRangeAt(0)
      const scope = closestScope(range.startContainer)
      if (!scope || scope !== closestScope(range.endContainer) || !container.contains(scope)) return null

      const { entries, text } = readScope(scope)
      let [s, t] = expandToFormulas(
        entries,
        pointToOffset(entries, text.length, range.startContainer, range.startOffset),
        pointToOffset(entries, text.length, range.endContainer, range.endOffset),
      )
      while (s < t && /\s/.test(text[s])) s++
      while (t > s && /\s/.test(text[t - 1])) t--
      if (s >= t) return null

      const scopeId = scope.dataset.stabiloScope ?? ''
      const canErase = (marksRef.current[scopeId] ?? []).some((m) => {
        const r = resolve(m, text)
        return r !== null && r[0] < t && r[1] > s
      })
      const rect = range.getBoundingClientRect()
      return { scope: scopeId, start: s, end: t, x: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom, canErase }
    }

    function fromClick(x: number, y: number): Toolbar | null {
      const container = containerRef.current
      const target = document.elementFromPoint(x, y)
      if (!container || !target || !container.contains(target)) return null
      const formula = target.closest('.katex[data-stabilo]')
      const caret = formula ? null : caretAt(x, y)
      const scope = formula ? closestScope(formula) : caret ? closestScope(caret.node) : null
      if (!scope) return null

      const { entries, text } = readScope(scope)
      const pos = formula
        ? (entries.find((e) => e.katex === formula)?.start ?? -1)
        : pointToOffset(entries, text.length, caret!.node, caret!.offset)
      const scopeId = scope.dataset.stabiloScope ?? ''
      for (const mark of marksRef.current[scopeId] ?? []) {
        const r = resolve(mark, text)
        if (r && pos >= r[0] && pos < r[1]) {
          return { scope: scopeId, start: r[0], end: r[1], x, top: y - 8, bottom: y + 8, canErase: true, current: mark.color }
        }
      }
      return null
    }

    function onMouseUp(e: MouseEvent) {
      if (e.target instanceof Element && e.target.closest('[data-stabilo-toolbar]')) return
      // Let the browser finish updating the selection first.
      setTimeout(() => setToolbar(fromSelection() ?? fromClick(e.clientX, e.clientY)), 0)
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'Escape') setToolbar(null)
      else if (e.shiftKey) setToolbar(fromSelection())
    }

    const onResize = () => setToolbar(null)

    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('keyup', onKeyUp)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', onResize)
    }
  }, [containerRef])

  function apply(color: StabiloColor | null) {
    const container = containerRef.current
    if (!toolbar || !container) return
    const scope = container.querySelector(`[data-stabilo-scope="${CSS.escape(toolbar.scope)}"]`)
    if (!scope) return
    const { text } = readScope(scope)
    const next = { ...marks, [toolbar.scope]: applyMark(marks[toolbar.scope] ?? [], text, toolbar.start, toolbar.end, color) }
    if (next[toolbar.scope].length === 0) delete next[toolbar.scope]
    setMarks(next)
    saveStabiloMarks(courseId, next)
    window.getSelection()?.removeAllRanges()
    setToolbar(null)
  }

  if (!toolbar) return null

  const above = toolbar.top > 72
  const x = Math.min(Math.max(toolbar.x, 110), window.innerWidth - 110)

  return (
    <div
      data-stabilo-toolbar
      role="toolbar"
      aria-label="Surligneur"
      onMouseDown={(e) => e.preventDefault()}
      style={{ left: x, top: above ? toolbar.top - 8 : toolbar.bottom + 8 }}
      className={`fixed z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900 ${
        above ? '-translate-y-full' : ''
      }`}
    >
      {COLORS.map((c) => (
        <button
          key={c.id}
          onClick={() => apply(c.id)}
          aria-label={`Surligner en ${c.label.toLowerCase()}`}
          title={c.label}
          className={`h-6 w-6 rounded-full ${c.swatch} ring-slate-500 ring-offset-2 ring-offset-white transition hover:scale-110 dark:ring-slate-300 dark:ring-offset-slate-900 ${
            toolbar.current === c.id ? 'ring-2' : ''
          }`}
        />
      ))}
      {toolbar.canErase && (
        <>
          <span className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={() => apply(null)}
            className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Effacer
          </button>
        </>
      )}
    </div>
  )
}
