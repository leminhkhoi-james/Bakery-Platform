import React, { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../services/apiClient.js'
import { vendorManagementService } from '../../services/vendorManagementService.js'
import { onboardingService } from '../../services/onboardingService.js'
import { operationsPayload } from '../../services/managementModels.js'
import { useAuth } from '../../context/useAuth.js'
import { BakeryProfileForm } from './BakeryManager.jsx'
import BakeryOperationsForm from './BakeryOperationsForm.jsx'
import { ApiErrorMessage, buttonClass } from './ApiState.jsx'
import { StatusBadge } from '../common/WorkspaceUI.jsx'
import { usePartnerActivation } from '../../hooks/usePartnerActivation.js'
import { uiLabel } from '../../services/uiLabels.js'

export default function OwnerBakeryOnboarding({ onBusy, onCreated, defaults, drafts = [] }) {
  const { roles, user } = useAuth()
  const isOwner = roles.includes('BAKERY_OWNER')
  const [initialDefaults] = useState(defaults)
  const [newRequested, setNewRequested] = useState(false)
  const [profileDraft, setProfileDraft] = useState(null)
  const [editingBasics, setEditingBasics] = useState(true)
  const [savedBakery, setBakery] = useState(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [activationNotice, setActivationNotice] = useState(null)
  const flight = useRef(false)
  const activation = usePartnerActivation({
    bakeryId: savedBakery?.id,
    enabled: Boolean(!isOwner && savedBakery && savedBakery.status !== 'DRAFT'),
    paused: busy,
    onActivated: (confirmed) => {
      setActivationNotice('Hồ sơ và gói đã được duyệt. Quyền chủ tiệm đã được cập nhật.')
      onCreated?.(confirmed)
    },
  })
  const bakery = activation.bakery || savedBakery

  useEffect(() => {
    let active = true
    if (!isOwner) {
      onboardingService.get().then((existing) => {
        if (active && existing) {
          setBakery(existing)
          if (existing.status !== 'DRAFT') {
            setSaved(true)
          }
        }
      }).catch(() => {})
    }
    return () => { active = false }
  }, [isOwner])

  async function run(action) {
    if (flight.current) return
    flight.current = true
    setBusy(true)
    onBusy?.(true)
    setError(null)
    setActivationNotice(null)
    try {
      await action()
    } catch (failure) {
      setError(failure)
    } finally {
      flight.current = false
      setBusy(false)
      onBusy?.(false)
    }
  }

  const defaultOperations = initialDefaults?.operations?.addresses?.length ? initialDefaults.operations : {
    addresses: [{ addressLine: '', ward: '', district: '', city: '', isPrimary: true }],
    serviceAreas: [{ city: '', district: '', deliveryFee: 0, minimumOrder: 0, active: true }],
    businessHours: [1, 2, 3, 4, 5, 6, 7].map((day) => ({
      dayOfWeek: day,
      closed: day > 5,
      opensAt: '08:00',
      closesAt: '20:00',
    })),
  }

  if (isOwner && !bakery && !profileDraft && drafts.length && !newRequested) return <section className="space-y-3"><h3>Tiếp tục tiệm đã lưu</h3><p>Bạn có hồ sơ chưa hoàn tất. Chọn tiệm để tiếp tục, tránh đăng ký lại cùng một tiệm.</p>{drafts.map(draft => <button type="button" key={draft.id} className={buttonClass} onClick={() => onCreated?.(draft)}>{draft.name} · Tiếp tục hồ sơ nháp</button>)}<button type="button" className={buttonClass + ' sc-action-button--secondary'} onClick={() => setNewRequested(true)}>Đăng ký tiệm khác</button></section>

  // Step 1: Profile Form
  if (!bakery && editingBasics) {
    return (
      <div className="space-y-4">
        <BakeryProfileForm
          create
          error={error}
          busy={busy}
          profile={profileDraft || { name: initialDefaults?.name || '', email: initialDefaults?.email || user?.email || '', phoneNumber: initialDefaults?.phoneNumber || user?.phoneNumber || user?.phone || '' }}
          onSave={(input) => run(async () => {
            if (isOwner) {
              const created = await vendorManagementService.createBakery(input)
              setBakery(created)
            } else {
              setProfileDraft(input)
              setEditingBasics(false)
            }
          })}
        />

        {error && (
          <p className="text-sm">
            Nếu kết nối bị ngắt khi tạo tiệm, hãy kiểm tra hồ sơ với bộ phận hỗ trợ trước khi gửi lại để tránh tạo trùng.
          </p>
        )}
      </div>
    )
  }

  // Step 2: Operations Configuration for Customer Onboarding or Owner Draft
  if (!bakery && profileDraft) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary">
            Bước 2: Cấu hình vận hành cho tiệm <strong>{profileDraft.name}</strong>
          </p>
          <p className="text-xs text-stone-600 mt-1">
            Thiết lập địa chỉ bếp/xưởng, khu vực nhận giao bánh và giờ mở cửa trước khi gửi duyệt.
          </p>
        </div>
        <BakeryOperationsForm
          error={error}
          operations={defaultOperations}
          busy={busy}
          onSave={(input) => run(async () => {
            const operations = operationsPayload(input)
            if (!operations.addresses.some((row) => row.isPrimary) || !operations.serviceAreas.some((row) => row.active)) {
              throw new ApiError('Cần một địa chỉ chính và ít nhất một khu vực giao hàng đang phục vụ.', 422)
            }
            const confirmed = await onboardingService.submit({ ...profileDraft, operations })
            setBakery(confirmed)
            setSaved(true)
            onCreated?.(confirmed)
          })}
        />

        <button
          type="button"
          disabled={busy}
          className="text-sm text-stone-600 underline"
          onClick={() => setEditingBasics(true)}
        >
          ← Quay lại chỉnh sửa thông tin tiệm
        </button>
      </div>
    )
  }

  // Step 3: Existing Bakery / Owner Operations / Submitting for Approval
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status">
          Hồ sơ tiệm: <strong>{bakery.name}</strong> · Mã tiệm:{' '}
          <span className="break-all">{bakery.id}</span>
        </p>
        {bakery.status && <StatusBadge status={bakery.status} />}
      </div>

      {bakery.status === 'DRAFT' && (
        <>
          <BakeryOperationsForm
            error={error}
            operations={bakery.operations?.addresses?.length ? bakery.operations : defaultOperations}
            busy={busy}
            onSave={(input) => run(async () => {
              const operations = operationsPayload(input)
              if (!operations.addresses.some((row) => row.isPrimary) || !operations.serviceAreas.some((row) => row.active)) {
                throw new ApiError('Cần một địa chỉ chính và ít nhất một khu vực giao hàng đang phục vụ.', 422)
              }
              const confirmed = isOwner
                ? await vendorManagementService.saveOperations(bakery.id, operations)
                : (await onboardingService.submit({ name: bakery.name, phoneNumber: bakery.phoneNumber, email: bakery.email, operations })).operations
              setBakery((current) => ({ ...current, operations: confirmed }))
              setSaved(true)
            })}
          />
          {saved && <p role="status" className="text-sm text-green-700 font-medium">Cấu hình vận hành đã được lưu thành công.</p>}
          <button
            type="button"
            disabled={busy || !saved}
            className={buttonClass}
            onClick={() => run(async () => {
              const confirmed = isOwner
                ? await vendorManagementService.submitBakery(bakery.id)
                : bakery
              setBakery(confirmed)
              onCreated?.(confirmed)
            })}
          >
            {busy ? 'Đang xử lý…' : 'Gửi hồ sơ để duyệt'}
          </button>
          <p className="text-sm">
            Hồ sơ gửi duyệt chưa đồng nghĩa được mở bán. Cần quản trị viên phê duyệt và gói dịch vụ có hiệu lực.
          </p>
        </>
      )}

      {bakery.status !== 'DRAFT' && (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 space-y-3">
          <p className="text-sm">
            Hồ sơ tiệm <strong>{bakery.name}</strong> đang ở trạng thái{' '}
            <strong className="text-primary">{uiLabel(bakery.status, 'Đang chờ duyệt')}</strong>.
          </p>
          {!isOwner && (
            <>
              <p className="text-xs text-stone-600">
                Quyền chủ tiệm tự cập nhật sau khi hồ sơ được duyệt và gói có hiệu lực. Bạn không cần gửi thêm yêu cầu kích hoạt.
              </p>
              <button
                type="button"
                disabled={busy || activation.checking}
                className={buttonClass}
                onClick={activation.check}
              >
                {activation.checking ? 'Đang kiểm tra…' : 'Kiểm tra trạng thái duyệt'}
              </button>
              {activation.checkedAt && <p role="status" className="text-xs text-stone-600">Đã cập nhật lúc {new Date(activation.checkedAt).toLocaleTimeString('vi-VN')}. Hồ sơ: {uiLabel(bakery.status)}. Gói dịch vụ: {activation.subscription?.currentSubscription?.status === 'ACTIVE' ? 'Đang có hiệu lực' : 'Chưa có kỳ dịch vụ đang hiệu lực'}.</p>}
            </>
          )}
          {activationNotice && <p role="status" className="text-sm text-green-700 font-medium">{activationNotice}</p>}
        </div>
      )}


      {activation.error && <ApiErrorMessage error={activation.error} />}
    </div>
  )
}
