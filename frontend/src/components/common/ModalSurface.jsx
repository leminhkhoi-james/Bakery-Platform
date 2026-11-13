import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createModalDraft, isBackdropPoint, isTopModal, registerModal, serializeModalForm } from './modalState.js'
import './modal.css'

const ModalContext = createContext(null)
function ModalContent({ children, requestClose }) {
  return typeof children === 'function' ? children({ requestClose }) : children
}

// Tracks structural changes (add/remove rows) as well as edited field values.
export function ModalFormState({ value, busy = false }) {
  const modal = useContext(ModalContext)
  const [initial] = useState(() => serializeModalForm(value)), current = useRef({ value, busy })
  useLayoutEffect(() => { current.current = { value, busy } }, [value, busy])
  useEffect(() => modal?.register({ changed: () => initial !== serializeModalForm(current.current.value), busy: () => current.current.busy }), [modal, initial])
  return null
}

export default function ModalSurface({ children, onClose, busy = false, guardChanges = true, className = '', labelledBy, label, role = 'dialog' }) {
  const dialog = useRef(null), draft = useRef(null), startedOutside = useRef(false)
  const sources = useRef(new Set()), current = useRef({ busy, onClose, guardChanges })
  useLayoutEffect(() => { current.current = { busy, onClose, guardChanges } }, [busy, onClose, guardChanges])
  const [discard, setDiscard] = useState(false)
  const confirmTitle = useId()
  const [context] = useState(() => ({ register(source) { sources.current.add(source); return () => sources.current.delete(source) } }))
  const isBusy = useCallback(() => current.current.busy || [...sources.current].some((source) => source.busy()) || [...(dialog.current?.querySelectorAll('[data-modal-busy="true"]') || [])].some((element) => element.closest('dialog') === dialog.current), [])
  const requestClose = useCallback(() => {
    if (!isTopModal(dialog.current) || isBusy()) return false
    if (current.current.guardChanges && (draft.current?.changed() || [...sources.current].some((source) => source.changed()))) { setDiscard(true); return false }
    current.current.onClose?.()
    return true
  }, [isBusy])
  useEffect(() => {
    const element = dialog.current
    const release = registerModal(element, document)
    element.showModal()
    draft.current = createModalDraft(element)
    const observer = new MutationObserver(() => draft.current.capture())
    observer.observe(element, { childList: true, subtree: true })
    return () => { observer.disconnect(); element.close(); release() }
  }, [])
  return <ModalContext.Provider value={context}>
    <dialog ref={dialog} role={role} aria-modal="true" aria-labelledby={labelledBy} aria-label={label} className={className}
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); requestClose() }}
      onKeyDown={(event) => { if (event.key === 'Escape') event.stopPropagation() }}
      onPointerDown={(event) => { if (isTopModal(dialog.current)) startedOutside.current = isBackdropPoint(event, dialog.current) }}
      onClick={(event) => { if (isTopModal(dialog.current) && startedOutside.current && isBackdropPoint(event, dialog.current)) requestClose(); startedOutside.current = false }}
      onClickCapture={(event) => { if (event.target.closest?.('[data-modal-close]')?.closest('dialog') === dialog.current) { event.preventDefault(); event.stopPropagation(); requestClose() } }}
      onFocusCapture={() => draft.current?.capture()} onInputCapture={(event) => draft.current?.touch(event.target)} onChangeCapture={(event) => draft.current?.touch(event.target)}>
      <ModalContent requestClose={requestClose}>{children}</ModalContent>
    </dialog>
    {discard && <ModalSurface role="alertdialog" labelledBy={confirmTitle} className="sc-discard-dialog" guardChanges={false} busy={busy} onClose={() => setDiscard(false)}>
      {({ requestClose: keepEditing }) => <><header><h2 id={confirmTitle}>Bỏ thay đổi chưa lưu?</h2><button type="button" className="sc-icon-button" aria-label="Tiếp tục chỉnh sửa" disabled={busy} onClick={keepEditing}>×</button></header><p>Những thay đổi của bạn chưa được lưu. Bạn có muốn bỏ thay đổi và đóng cửa sổ này?</p><div className="sc-action-row"><button type="button" className="sc-button sc-action-button--secondary" disabled={busy} onClick={keepEditing}>Tiếp tục chỉnh sửa</button><button type="button" className="sc-button sc-action-button--danger" disabled={busy} onClick={() => { if (!isBusy()) { setDiscard(false); current.current.onClose?.() } }}>Bỏ thay đổi và đóng</button></div></>}
    </ModalSurface>}
  </ModalContext.Provider>
}
