// One stack for native dialogs, including discard confirmations.
const dialogs = []
const scrollLocks = new WeakMap()
export function lockPageScroll(document) {
  let lock = scrollLocks.get(document)
  if (!lock) { lock = { count: 0, previous: document.body.style.overflow }; scrollLocks.set(document, lock) }
  lock.count++
  document.body.style.overflow = 'hidden'
  let released = false
  return () => {
    if (released) return
    released = true
    if (--lock.count === 0) { document.body.style.overflow = lock.previous; scrollLocks.delete(document) }
  }
}
export const isTopModal = (element) => dialogs.at(-1)?.element === element
export function registerModal(element, document) {
  const previousFocus = document.activeElement
  const releaseScroll = lockPageScroll(document)
  const entry = { element, previousFocus }
  dialogs.push(entry)
  return () => {
    const top = isTopModal(element)
    const index = dialogs.indexOf(entry)
    if (index === -1) return
    dialogs.splice(index, 1)
    for (const open of dialogs) if (element.contains(open.previousFocus)) open.previousFocus = entry.previousFocus
    releaseScroll()
    const remaining = dialogs.at(-1)?.element
    if (!top) {
      if (remaining && !remaining.contains(document.activeElement)) (remaining.querySelector('button:not(:disabled)') || remaining).focus()
      return
    }
    const focus = entry.previousFocus
    if (focus?.isConnected && (!remaining || remaining.contains(focus))) focus.focus()
    else if (remaining?.isConnected) (remaining.querySelector('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]') || remaining).focus()
  }
}

const controls = 'input:not([type="hidden"]), textarea, select'
export function serializeModalForm(value) {
  const normalize = (item) => item == null ? '' : typeof item === 'number' ? String(item) : Array.isArray(item) ? item.map(normalize) : typeof item === 'object' ? Object.fromEntries(Object.entries(item).map(([key, child]) => [key, normalize(child)])) : item
  return JSON.stringify(normalize(value))
}
const valueOf = (field) => field.type === 'checkbox' || field.type === 'radio' ? field.checked : field.type === 'file' ? [...field.files].map((file) => [file.name, file.size, file.lastModified]) : field.multiple ? [...field.selectedOptions].map((option) => option.value) : field.value
export function createModalDraft(element) {
  const baseline = new Map(), touched = new Set()
  const owns = (field) => field.closest('dialog') === element
  const capture = () => { for (const field of element.querySelectorAll(controls)) if (owns(field) && !baseline.has(field)) baseline.set(field, JSON.stringify(valueOf(field))) }
  capture()
  return {
    capture,
    touch(field) { if (field?.matches?.(controls) && owns(field)) touched.add(field) },
    changed() { return [...touched].some((field) => field.isConnected && owns(field) && baseline.has(field) && baseline.get(field) !== JSON.stringify(valueOf(field))) },
  }
}

export function isBackdropPoint(event, element) {
  if (event.target !== element) return false
  const box = element.getBoundingClientRect()
  return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom
}
