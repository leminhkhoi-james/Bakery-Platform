import React, { useId, useState } from 'react'
import { ModalFormState } from '../../../components/common/ModalSurface.jsx'
import { ChoiceButtons } from '../../../components/common/EntityActionButtons.jsx'
import { DetailDrawer, Icon } from '../../../components/common/WorkspaceUI.jsx'
import { ApiErrorMessage, inputClass } from '../../../components/management/ApiState.jsx'
import { PLAN_FEATURES, planFeature, planFeatureLabel, planStatusLabel, planFeedbackError } from '../../../services/planPresentation.js'
import { formatPlanPrice, parsePlanPrice, planFormErrors, planPriceDescriptionConflict } from '../../../services/planFormPresentation.js'
import { cleanPresentationLabel } from '../../../services/uiLabels.js'

function FeatureRow({ row, rows, errors, onUpdate, onRemove }) {
  const feature = planFeature(row.code), [custom, setCustom] = useState(() => !feature && Boolean(row.code))
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const codeError = errors[row.uiKey + ':code'], valueError = errors[row.uiKey + ':value']
  return <div className="sc-plan-feature-row">
    <label><span className="sr-only">Loại quyền lợi</span><select required name={custom ? undefined : row.uiKey + ":code"} aria-label="Loại quyền lợi" aria-required="true" aria-invalid={!!codeError} value={custom ? '__custom' : row.code} className={inputClass} onChange={(event) => { const other = event.target.value === '__custom'; setCustom(other); if (other) setAdvancedOpen(true); onUpdate('code', other ? '' : event.target.value) }}>
      {!row.code && !custom && <option value="" disabled>Chọn loại quyền lợi</option>}{feature && !custom && <option value={row.code}>{feature.label}</option>}{PLAN_FEATURES.filter((item) => custom || item.code !== feature?.code).map((item) => <option key={item.code} value={item.code} disabled={rows.some((other) => other.uiKey !== row.uiKey && other.code.trim() === item.code)}>{item.label}</option>)}<option value="__custom">Quyền lợi khác</option>
    </select>{!custom && codeError && <small className="sc-plan-field-error">{row.code ? codeError : 'Chọn loại quyền lợi.'}</small>}</label>
    <label><span className="sr-only">Giá trị quyền lợi</span>{feature?.code === 'FEATURED_LISTING' ? <select required name={row.uiKey + ":value"} aria-label="Giá trị quyền lợi" aria-required="true" aria-invalid={!!valueError} className={inputClass} value={String(row.value)} onChange={(event) => onUpdate('value', event.target.value)}>{!['true', 'false'].includes(String(row.value)) && <option value={row.value}>Chưa xác định</option>}<option value="true">Có</option><option value="false">Không</option></select> : <input required name={row.uiKey + ":value"} aria-label="Giá trị quyền lợi" aria-required="true" aria-invalid={!!valueError} maxLength={255} className={inputClass} value={row.value} placeholder={feature?.limit ? '-1: không giới hạn' : 'Nội dung quyền lợi'} onChange={(event) => onUpdate('value', event.target.value)} />}{valueError && <small className="sc-plan-field-error">{valueError}</small>}</label>
    <button type="button" className="sc-icon-button" aria-label={'Xóa quyền lợi ' + planFeatureLabel(row.code)} onClick={onRemove}><Icon name="delete" /></button>
    {custom && <details className="sc-plan-custom-feature" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}><summary>Cấu hình nâng cao</summary><label><span>Mã quyền lợi <span className="sc-plan-required" aria-hidden="true">*</span></span><input required name={row.uiKey + ":code"} aria-label="Mã quyền lợi" aria-required="true" aria-invalid={!!codeError} maxLength={80} className={inputClass} value={row.code} onChange={(event) => onUpdate('code', event.target.value)} />{codeError && <small className="sc-plan-field-error">{codeError}</small>}<small className="sc-plan-form-help">Mã dùng để phân biệt quyền lợi; chỉ chỉnh khi cần cấu hình loại khác.</small></label></details>}
  </div>
}
function FeatureEditor({ rows, errors, onChange }) {
  const update = (index, key, value) => onChange(rows.map((row, i) => i === index ? { ...row, [key]: value } : row))
  return <section className="sc-plan-form-section sc-plan-feature-editor"><div className="sc-plan-section-heading"><h3>Quyền lợi của gói</h3><button type="button" className="sc-button sc-action-button--secondary" onClick={() => onChange([...rows, { code: '', value: '', uiKey: crypto.randomUUID() }])}><Icon name="add" />Thêm quyền lợi</button></div>
    {!rows.length && <p className="sc-plan-form-help">Chưa cấu hình quyền lợi.</p>}
    {rows.length > 0 && <div className="sc-plan-feature-columns" aria-hidden="true"><span>Loại quyền lợi <span className="sc-plan-required" aria-hidden="true">*</span></span><span>Giá trị <span className="sc-plan-required" aria-hidden="true">*</span></span><span /></div>}
    {rows.map((row, index) => <FeatureRow key={row.uiKey} row={row} rows={rows} errors={errors} onUpdate={(key, value) => update(index, key, value)} onRemove={() => onChange(rows.filter((_, i) => i !== index))} />)}
  </section>
}

export function AdminPlanForm({ plan, busy, onSave, onClose, error }) {
  const formId = useId()
  const [values, setValues] = useState(() => ({ ...(plan || { code: '', name: '', description: '', monthlyPrice: '', currency: 'VND', billingPeriodMonths: 1, status: 'ACTIVE' }), name: cleanPresentationLabel(plan?.name), description: cleanPresentationLabel(plan?.description), featureRows: Object.entries(plan?.features || {}).map(([code, value]) => ({ code, value, uiKey: code })) }))
  const [priceText, setPriceText] = useState(() => formatPlanPrice(plan?.monthlyPrice ?? ''))
  const [touched, setTouched] = useState({}), [submitted, setSubmitted] = useState(false)
  const errors = planFormErrors(values), shown = (key) => (submitted || touched[key]) && errors[key]
  const field = (key) => ({ name: key, required: ['code', 'name', 'billingPeriodMonths'].includes(key), value: values[key] ?? '', 'aria-invalid': !!shown(key), onBlur: () => setTouched((current) => ({ ...current, [key]: true })), onChange: (event) => setValues((current) => ({ ...current, [key]: event.target.value })) })
  const fieldError = (key) => shown(key) && <small className="sc-plan-field-error">{errors[key]}</small>
  const footer = <div className="sc-plan-form-footer"><div className="sc-action-row"><button type="button" disabled={busy} className="sc-button sc-action-button--secondary" data-modal-close onClick={onClose}>Hủy</button><button type="submit" form={formId} disabled={busy} className="sc-button"><Icon name="save" />{busy ? 'Đang lưu…' : plan ? 'Lưu thay đổi' : 'Lưu gói'}</button></div></div>
  return <DetailDrawer title={plan ? 'Sửa gói dịch vụ' : 'Tạo gói dịch vụ'} headerContent={<h2>{plan ? 'Sửa gói dịch vụ' : 'Tạo gói dịch vụ'}</h2>} className="sc-plan-form-dialog" footer={footer} onClose={onClose} busy={busy}>
    <form id={formId} noValidate onSubmit={(event) => {
      event.preventDefault(); setSubmitted(true)
      if (busy) return
      if (Object.keys(errors).length) {
        const input = event.currentTarget.elements.namedItem(Object.keys(errors)[0])
        const advanced = input?.closest?.('details')
        if (advanced) advanced.open = true
        input?.focus(); return
      }
      // Display cleanup must not silently rewrite untouched persisted text.
      const preserved = { ...values }
      for (const key of ['name', 'description']) if (plan && values[key] === cleanPresentationLabel(plan[key])) preserved[key] = plan[key]
      onSave(preserved)
    }}>
      <ModalFormState value={values} busy={busy} /><p className="sc-plan-required-help"><span className="sc-plan-required" aria-hidden="true">*</span> Trường bắt buộc</p><fieldset disabled={busy} className="sc-plan-form-fields">
        <section className="sc-plan-form-section"><h3>Thông tin cơ bản</h3><div className="sc-plan-basic-grid">
          <label><span>Mã gói <span className="sc-plan-required" aria-hidden="true">*</span></span><input maxLength={50} {...field('code')} className={inputClass} />{fieldError('code')}{plan && <small className="sc-plan-form-help">Mã gói đã có đơn mua không thể thay đổi.</small>}</label>
          <label><span>Tên gói <span className="sc-plan-required" aria-hidden="true">*</span></span><input maxLength={120} {...field('name')} className={inputClass} />{fieldError('name')}</label>
          <label><span>Giá mỗi tháng (đ) <span className="sc-plan-required" aria-hidden="true">*</span></span><input required name="monthlyPrice" inputMode="decimal" placeholder="199.000" value={priceText} aria-invalid={!!shown('monthlyPrice')} onBlur={() => { setTouched((current) => ({ ...current, monthlyPrice: true })); if (Number.isFinite(Number(values.monthlyPrice))) setPriceText(formatPlanPrice(values.monthlyPrice)) }} onChange={(event) => { setPriceText(event.target.value); setValues((current) => ({ ...current, monthlyPrice: parsePlanPrice(event.target.value) })) }} className={inputClass} />{fieldError('monthlyPrice')}</label>
          <label><span>Chu kỳ thanh toán (tháng) <span className="sc-plan-required" aria-hidden="true">*</span></span><input type="number" min="1" step="1" {...field('billingPeriodMonths')} className={inputClass} />{fieldError('billingPeriodMonths')}</label>
          <label>Tiền tệ<input readOnly value={values.currency} className={inputClass} /><small className="sc-plan-form-help">Chỉ hỗ trợ đồng Việt Nam (VND).</small></label>
          <p className="sc-plan-form-help sc-plan-billing-help">Số tiền cho một kỳ bằng giá mỗi tháng nhân số tháng của chu kỳ.</p>
        </div></section>
        <section className="sc-plan-form-section"><h3>Trạng thái cung cấp</h3>{plan?.status === 'ARCHIVED' ? <p className="sc-plan-form-help">{planStatusLabel(plan.status)}. Khôi phục gói từ menu thao tác nếu cần mở cung cấp lại.</p> : <ChoiceButtons label="Cho phép đăng ký mới" value={values.status} options={['ACTIVE', 'INACTIVE'].map((value) => ({ value, label: planStatusLabel(value) }))} onChange={(status) => setValues((current) => ({ ...current, status }))} />}</section>
        <section className="sc-plan-form-section"><h3>Mô tả gói</h3><label><span className="sr-only">Mô tả gói</span><textarea {...field('description')} aria-label="Mô tả gói" rows={3} className={inputClass} /></label>{planPriceDescriptionConflict(values) && <p role="status" className="sc-plan-data-warning"><Icon name="info" />Mô tả đề cập miễn phí nhưng gói có giá lớn hơn 0 đ. Hãy đối chiếu lại nội dung trước khi lưu.</p>}</section>
        <FeatureEditor rows={values.featureRows} errors={submitted ? errors : Object.fromEntries(Object.entries(errors).filter(([key]) => key.includes(':')))} onChange={(featureRows) => setValues((current) => ({ ...current, featureRows }))} />
        <p className="sc-plan-form-help">Các kỳ đã mua giữ nguyên quyền lợi và giá cũ. Thay đổi áp dụng cho đăng ký mới.</p>
      </fieldset>{submitted && Object.keys(errors).length > 0 && <p role="alert" className="sc-plan-field-error">Vui lòng kiểm tra các trường được đánh dấu trước khi lưu.</p>}{error && <ApiErrorMessage error={planFeedbackError(error)} />}
    </form>
  </DetailDrawer>
}
