import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Compact markdown renderer for chat replies.
 *
 * react-markdown without remark-gfm leaves tables as raw "| a | b |" text, so
 * tables are turned into bullet lists first ("- **a**: b"). Headings, lists,
 * bold and rules get small, theme-matched styles that fit a narrow chat bubble.
 */
export function tablesToLists(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
    if (isRow(lines[i]) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      i += 2; // skip header + separator row
      while (i < lines.length && isRow(lines[i])) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).filter(Boolean);
        if (cells.length) out.push(`- **${cells[0].replace(/\*\*/g, '')}**${cells.length > 1 ? ': ' + cells.slice(1).join(' — ') : ''}`);
        i += 1;
      }
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }
  return out.join('\n');
}

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

const ChatMarkdown: React.FC<ChatMarkdownProps> = ({ content, className = '' }) => (
  <div className={`text-sm leading-relaxed break-words ${className}`}>
    <ReactMarkdown
      components={{
        h1: ({ children }) => <p className="font-semibold text-neutral-900 dark:text-white mt-2 mb-1">{children}</p>,
        h2: ({ children }) => <p className="font-semibold text-neutral-900 dark:text-white mt-2 mb-1">{children}</p>,
        h3: ({ children }) => <p className="font-semibold text-neutral-900 dark:text-white mt-2 mb-1">{children}</p>,
        h4: ({ children }) => <p className="font-semibold text-neutral-900 dark:text-white mt-2 mb-1">{children}</p>,
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-neutral-900 dark:text-white">{children}</strong>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1 marker:text-primary-500">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1 marker:text-primary-500">{children}</ol>,
        li: ({ children }) => <li className="pl-0.5">{children}</li>,
        hr: () => <hr className="my-2 border-neutral-200 dark:border-neutral-600" />,
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline">
            {children}
          </a>
        ),
        code: ({ children }) => <code className="px-1 rounded bg-neutral-200/70 dark:bg-neutral-600 text-xs">{children}</code>,
      }}
    >
      {tablesToLists(content)}
    </ReactMarkdown>
  </div>
);

export default ChatMarkdown;
