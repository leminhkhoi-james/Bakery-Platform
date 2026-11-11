import { useEffect, useRef, useState } from 'react'

// Keep server paging and row numbers aligned with the space available to a table.
export function useViewportPageSize(onResizePage, enabled = true) {
  const [container, containerRef] = useState(null), reset = useRef(onResizePage)
  reset.current = onResizePage
  const [pageSize, setPageSize] = useState(6)
  const currentSize = useRef(6)
  useEffect(() => {
    if (!enabled || !container) return
    let frame = 0, rowHeight = 0, viewport = ''
    const measure = () => {
      frame = 0
      const table = container.querySelector('.sc-table')
      if (!table || !table.getClientRects().length) return
      const geometry = `${window.innerWidth}:${window.innerHeight}:${Math.round(table.getBoundingClientRect().width)}`
      if (geometry !== viewport) { rowHeight = 0; viewport = geometry }
      const rows = [...table.querySelectorAll('tbody > tr')]
      if (!rows.length) return
      rowHeight = Math.max(rowHeight, ...rows.map(row => row.getBoundingClientRect().height))
      if (!rowHeight) return
      let scroll = window.scrollY
      for (let parent = table.parentElement; parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) scroll += parent.scrollTop
      // Reports below the fold get a viewport-sized table once scrolled into view.
      const heading = table.querySelector('thead')?.getBoundingClientRect().height || 0
      const documentTop = Math.max(0, table.getBoundingClientRect().top + scroll)
      const top = documentTop + heading + rowHeight + 88 <= window.innerHeight ? documentTop : window.innerHeight * .25
      const available = Math.max(rowHeight, window.innerHeight - top - heading - 88)
      const next = Math.max(1, Math.min(100, Math.floor(available / rowHeight)))
      if (next !== currentSize.current) {
        currentSize.current = next
        reset.current?.()
        setPageSize(next)
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    container.dataset.adaptivePagination = 'true'
    const resize = new ResizeObserver(schedule), mutation = new MutationObserver(schedule)
    resize.observe(container)
    mutation.observe(container, { childList: true, subtree: true })
    window.addEventListener('resize', schedule)
    schedule()
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect(); window.removeEventListener('resize', schedule); delete container.dataset.adaptivePagination }
  }, [enabled, container])
  return { containerRef, pageSize }
}
