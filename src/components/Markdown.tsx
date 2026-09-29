import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

interface MarkdownProps {
  children: string
  className?: string
  stabiloScope?: string
}

export function Markdown({ children, className, stabiloScope }: MarkdownProps) {
  return (
    <div className={`markdown-body ${className ?? ''}`} data-stabilo-scope={stabiloScope}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
