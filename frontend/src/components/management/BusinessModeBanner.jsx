import { storageMessage } from '../../mockData/business/persistence.js'
import React, { useState } from 'react'
import { changeBusinessMode, simulationEnabled, simulationFailure } from '../../mockData/business/runtime.js'

export default function BusinessModeBanner() {
  const enabled = simulationEnabled()
  const [error, setError] = useState(null)
  return <aside className="sc-business-mode" aria-label="Nguồn dữ liệu kinh doanh">
    <div><strong>{enabled ? 'Không gian thực hành kinh doanh' : 'Dữ liệu kinh doanh trực tiếp'}</strong>{enabled && <p>Đơn hàng, thanh toán và doanh thu tại đây là dữ liệu mô phỏng, không phải giao dịch thực tế.</p>}</div>
    <button type="button" className="sc-button sc-action-button--secondary" onClick={() => { try { changeBusinessMode(!enabled) } catch (failure) { setError(storageMessage(failure)) } }}>{enabled ? 'Chuyển về dữ liệu thực tế' : 'Mở không gian thực hành'}</button>
    {(error || simulationFailure()) && <p role="alert">{error || simulationFailure()} <button type="button" className="sc-button sc-action-button--secondary" onClick={() => window.location.reload()}>Tải lại để khôi phục</button></p>}
  </aside>
}
