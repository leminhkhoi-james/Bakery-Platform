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

export default function OwnerBakeryOnboarding({ onBusy, onCreated }) {
  const { roles, user } = useAuth()
  const isOwner = roles.includes('BAKERY_OWNER')
  const [profileDraft, setProfileDraft] = useState(null)
  const [bakery, setBakery] = useState(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [activationNotice, setActivationNotice] = useState(null)
  const flight = useRef(false)

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
    onBusy(true)
    setError(null)
    setActivationNotice(null)
    try {
      await action()
    } catch (failure) {
      setError(failure)
    } finally {
      flight.current = false
      setBusy(false)
      onBusy(false)
    }
  }

  const defaultOperations = {
    addresses: [{ addressLine: '', ward: '', district: '', city: '', isPrimary: true }],
    serviceAreas: [{ city: '', district: '', deliveryFee: 0, minimumOrder: 0, active: true }],
    businessHours: [1, 2, 3, 4, 5, 6, 7].map((day) => ({
      dayOfWeek: day,
      closed: false,
      opensAt: '08:00',
      closesAt: '20:00',
    })),
  }

  // Step 1: Profile Form
  if (!bakery && !profileDraft) {
    return (
      <div className="space-y-4">
        <BakeryProfileForm
          create
          busy={busy}
          profile={user?.email ? { email: user.email } : undefined}
          onSave={(input) => run(async () => {
            if (isOwner) {
              const created = await vendorManagementService.createBakery(input)
              setBakery(created)
            } else {
              setProfileDraft(input)
            }
          })}
        />
        {error && <ApiErrorMessage error={error} />}
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
        {error && <ApiErrorMessage error={error} />}
        <button
          type="button"
          disabled={busy}
          className="text-sm text-stone-600 underline"
          onClick={() => setProfileDraft(null)}
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
            operations={bakery.operations || defaultOperations}
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
                Sau khi hồ sơ và gói dịch vụ được Ban quản trị phê duyệt hoàn tất, bấm nút bên dưới để truy cập Kênh quản lý tiệm bánh.
              </p>
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() => run(async () => {
                  const updatedUser = await onboardingService.complete(bakery.id)
                  setActivationNotice('Xác nhận thành công! Đang chuyển hướng đến Kênh quản lý tiệm bánh…')
                  onCreated?.(bakery)
                  setTimeout(() => {
                    if (typeof window !== 'undefined') {
                      window.location.reload()
                    }
                  }, 800)
                })}
              >
                {busy ? 'Đang kiểm tra…' : 'Vào Kênh quản lý tiệm bánh'}
              </button>
            </>
          )}
          {activationNotice && <p role="status" className="text-sm text-green-700 font-medium">{activationNotice}</p>}
        </div>
      )}

      {error && <ApiErrorMessage error={error} />}
    </div>
  )
}
