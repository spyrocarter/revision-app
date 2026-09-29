import { useEffect, useRef, useState, type RefObject } from 'react'

const supportsHighlight = typeof CSS !== 'undefined' && 'highlights' in CSS

function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function findRanges(root: HTMLElement, query: string): Range[] {
  const needle = fold(query.trim())
  if (!needle) return []

  const ranges: Range[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    // KaTeX duplicates every formula as invisible MathML; matching it would give invisible hits.
    acceptNode: (node) =>
      node.parentElement?.closest('.katex-mathml') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  })

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? ''
    // Folding can change string length, so keep a map from folded index back to the original offset.
    let folded = ''
    const offsets: number[] = []
    for (let i = 0; i < text.length; i++) {
      const f = fold(text[i])
      folded += f
      for (let k = 0; k < f.length; k++) offsets.push(i)
    }

    let at = folded.indexOf(needle)
    while (at !== -1) {
      const range = document.createRange()
      range.setStart(node, offsets[at])
      range.setEnd(node, offsets[at + needle.length - 1] + 1)
      ranges.push(range)
      at = folded.indexOf(needle, at + needle.length)
    }
  }
  return ranges
}

function scrollToRange(range: Range) {
  range.startContainer.parentElement?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

interface PageSearchProps {
  containerRef: RefObject<HTMLElement | null>
  focusSignal: number
  onClose: () => void
}

export function PageSearch({ containerRef, focusSignal, onClose }: PageSearchProps) {
  const [query, setQuery] = useState('')
  const [ranges, setRanges] = useState<Range[]>([])
  const [current, setCurrent] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [focusSignal])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const found = findRanges(root, query)
    setRanges(found)
    setCurrent(0)
    if (found[0]) scrollToRange(found[0])

    // Re-run when the content changes (tab switch, corrigé revealed, card flipped) without scrolling.
    const observer = new MutationObserver(() => {
      const updated = findRanges(root, query)
      setRanges(updated)
      setCurrent((c) => Math.min(c, Math.max(0, updated.length - 1)))
    })
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [containerRef, query])

  useEffect(() => {
    if (!supportsHighlight) return
    const results = new Highlight(...ranges)
    results.priority = 1
    CSS.highlights.set('search-results', results)
    const active = ranges[current]
    if (active) {
      const highlight = new Highlight(active)
      highlight.priority = 2
      CSS.highlights.set('search-current', highlight)
    } else {
      CSS.highlights.delete('search-current')
    }
  }, [ranges, current])

  useEffect(
    () => () => {
      if (!supportsHighlight) return
      CSS.highlights.delete('search-results')
      CSS.highlights.delete('search-current')
    },
    [],
  )

  function go(delta: number) {
    if (ranges.length === 0) return
    const next = (current + delta + ranges.length) % ranges.length
    setCurrent(next)
    scrollToRange(ranges[next])
  }

  const status = !query.trim() ? '' : ranges.length === 0 ? 'Aucun résultat' : `${current + 1} / ${ranges.length}`

  return (
    <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white py-1 pl-2 pr-1 dark:border-slate-700 dark:bg-slate-900">
      <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="m13 13 4 4" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            go(e.shiftKey ? -1 : 1)
          } else if (e.key === 'Escape') {
            onClose()
          }
        }}
        placeholder="Rechercher dans la page…"
        aria-label="Rechercher dans la page"
        className="w-44 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400"
      />
      <span className="min-w-[5.5rem] text-right text-xs tabular-nums text-slate-500 dark:text-slate-400" aria-live="polite">
        {status}
      </span>
      <button
        onClick={() => go(-1)}
        disabled={ranges.length === 0}
        className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
        aria-label="Résultat précédent"
        title="Précédent (Maj+Entrée)"
      >
        ↑
      </button>
      <button
        onClick={() => go(1)}
        disabled={ranges.length === 0}
        className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
        aria-label="Résultat suivant"
        title="Suivant (Entrée)"
      >
        ↓
      </button>
      <button
        onClick={onClose}
        className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Fermer la recherche"
        title="Fermer (Échap)"
      >
        ✕
      </button>
    </div>
  )
}
