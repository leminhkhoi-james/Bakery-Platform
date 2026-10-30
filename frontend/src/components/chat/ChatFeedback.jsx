import React from 'react'
import { chatErrorText } from '../../services/chatPresentation.js'
export default function ChatFeedback({ error, retry }) {
  return <div role="alert" className="sc-chat-feedback"><p>{chatErrorText(error)}</p>{retry && error?.status !== 401 && <button type="button" className="sc-button sc-action-button--secondary" onClick={retry}>Thử lại</button>}</div>
}
