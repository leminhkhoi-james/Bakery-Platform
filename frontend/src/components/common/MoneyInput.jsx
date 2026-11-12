import React, { useLayoutEffect, useRef, useState } from 'react'

const formatAmount = value => {
  const [integer, fraction] = String(value ?? '').split('.')
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (fraction === undefined ? '' : ',' + fraction)
}

export default function MoneyInput({ value, onChange, min, max, step = '1', type: _type, ...props }) {
  const input = useRef(null)
  const caret = useRef(null)
  const composing = useRef(false)
  const [compositionText, setCompositionText] = useState(null)
  const formatted = formatAmount(value)

  useLayoutEffect(() => {
    const element = input.current
    const amount = Number(value)
    let message = ''
    if (value !== '' && value != null) {
      if (!Number.isFinite(amount)) message = 'Vui lòng nhập số tiền hợp lệ.'
      else if (min !== undefined && amount < Number(min)) message = 'Số tiền tối thiểu là ' + formatAmount(min) + '.'
      else if (max !== undefined && amount > Number(max)) message = 'Số tiền tối đa là ' + formatAmount(max) + '.'
      else if (step && step !== 'any') {
        const units = (amount - Number(min || 0)) / Number(step)
        if (Math.abs(units - Math.round(units)) > 0.000001) message = 'Số tiền phải theo bước ' + formatAmount(step) + '.'
      }
    }
    element.setCustomValidity(message)
    if (!composing.current && caret.current !== null && document.activeElement === element) {
      element.setSelectionRange(caret.current, caret.current)
      caret.current = null
    }
  })

  function change(event) {
    const element = event.target
    if (composing.current || event.nativeEvent?.isComposing) {
      setCompositionText(element.value)
      return
    }
    const position = element.selectionStart ?? element.value.length
    const raw = element.value.replace(/[.\s]/g, '').replace(',', '.')
    if (!/^-?\d*(?:\.\d*)?$/.test(raw)) {
      element.value = formatted
      return
    }
    const characters = element.value.slice(0, position).replace(/[.\s]/g, '').length
    const display = formatAmount(raw)
    let remaining = characters, next = 0
    while (next < display.length && remaining > 0) {
      if (display[next] !== '.') remaining--
      next++
    }
    caret.current = next
    onChange?.({ ...event, target: { ...element, name: element.name, value: raw }, currentTarget: element })
    // Typing a grouping separator keeps the amount unchanged, so the parent
    // may skip rendering. Restore the existing display and caret in that case.
    if (raw === String(value ?? '')) {
      element.value = formatted
      element.setSelectionRange(next, next)
      caret.current = null
    }
  }

  return <input {...props} ref={input} type="text" inputMode="decimal"
    value={compositionText ?? formatted} onChange={change}
    onCompositionStart={event => {
      composing.current = true
      caret.current = null
      setCompositionText(event.currentTarget.value)
    }}
    onCompositionEnd={event => {
      composing.current = false
      setCompositionText(null)
      change(event)
    }}
  />
}
