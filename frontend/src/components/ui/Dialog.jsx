import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Dialog({ open, title, description, onClose, children, variant = 'dialog' }) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const sheet = variant === 'sheet'

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    const panel = panelRef.current
    const firstField = panel?.querySelector('input, select, textarea') || panel?.querySelector('button')
    firstField?.focus()
    document.body.classList.add('overflow-hidden')

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((node) => !node.disabled)
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('overflow-hidden')
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${sheet ? 'justify-end' : 'items-end justify-center p-4 sm:items-center'}`}>
      <button
        type="button"
        aria-label="Dismiss dialog"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={
          sheet
            ? 'relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-white p-6 shadow-xl'
            : 'relative z-10 max-h-[85svh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl'
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
            {description ? (
              <p id={descriptionId} className="mt-2 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="rounded-lg border border-line bg-white p-2 text-ink hover:bg-paper"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
