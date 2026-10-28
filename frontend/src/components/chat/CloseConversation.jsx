import React, { useState } from 'react'
import { useCatalogResource } from '../../hooks/useCatalogResource.js'
import { vendorManagementService } from '../../services/vendorManagementService.js'
import { memberCanEdit } from '../../services/managementModels.js'
import { ApiState, ApiErrorMessage, inputClass, buttonClass } from '../management/ApiState.jsx'
const loadPermission = async ({ conversation, user }) => {
  if (conversation.customerId === user.id) return user.roles?.includes('CUSTOMER') === true
  if (!user.roles?.some((role) => ['BAKERY_OWNER'].includes(role))) return false
  try { return memberCanEdit(await vendorManagementService.getMembership(conversation.bakeryId, user.id), user.roles) }
  catch (error) { if (error.status === 403) return false; throw error }
}
export default function CloseConversation({ conversation, user, busy, onClose }) {
  const permission = useCatalogResource(loadPermission, { conversation: { customerId: conversation.customerId, bakeryId: conversation.bakeryId }, user: { id: user.id, roles: user.roles } })
  const [reason, setReason] = useState(''), [confirmed, setConfirmed] = useState(false), [error, setError] = useState(null)
  if (conversation.status !== 'OPEN') return <p>Hội thoại đã đóng; không thể gửi thêm tin nhắn.</p>
  return <ApiState resource={permission}>{permission.data && <form className="space-y-3 border-t pt-4" onSubmit={async (event) => { event.preventDefault(); if (!confirmed || busy || !permission.data) return; setError(null); try { await onClose(reason) } catch (failure) { setError(failure) } }}><h3 className="font-bold">Đóng hội thoại</h3><label>Lý do<input value={reason} maxLength={500} disabled={busy} onChange={(event) => setReason(event.target.value)} className={inputClass} /></label><label className="flex gap-2"><input type="checkbox" disabled={busy} checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Đóng cuộc trò chuyện này. Bạn sẽ không thể gửi thêm tin nhắn.</label><button disabled={busy || !confirmed} className={buttonClass}>Đóng cuộc trò chuyện</button>{error && <ApiErrorMessage error={error} />}</form>}</ApiState>
}

