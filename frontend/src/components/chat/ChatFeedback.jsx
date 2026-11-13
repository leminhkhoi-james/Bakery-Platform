import React from 'react'
import { chatErrorText } from '../../services/chatPresentation.js'
import { useManualRefresh } from '../../context/ManualRefreshContext.js'
export default function ChatFeedback({ error, retry }) {
  const manualRefresh = useManualRefresh()
  return <div role="alert" className="sc-chat-feedback"><p>{chatErrorText(error)}</p>{manualRefresh && retry && error?.status !== 401 && <button type="button" className="sc-button sc-action-button--secondary" onClick={retry}>Thử lại</button>}</div>
}
