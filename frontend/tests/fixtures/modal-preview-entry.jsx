import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { DetailDrawer } from '../../src/components/common/WorkspaceUI.jsx'
import ModalSurface, { ModalFormState } from '../../src/components/common/ModalSurface.jsx'
import '../../src/index.css'
import '../../src/styles/artisan-workspace.css'
import '../../src/styles/design-system.css'

export default function Preview() {
  const [open, setOpen] = useState(''), [nested, setNested] = useState(false), [busy, setBusy] = useState(false)
  const [name, setName] = useState(''), [rows, setRows] = useState([])
  const show = (kind) => { setName(''); setRows([]); setBusy(kind === 'busy'); setOpen(kind) }
  return <main className="sc-customer p-6 space-y-4"><h1>Kiểm tra hành vi popup</h1><div className="sc-action-row"><button className="sc-button" onClick={() => show('info')}>Mở thông tin</button><button className="sc-button" onClick={() => show('form')}>Mở form</button><button className="sc-button" onClick={() => show('busy')}>Mở xử lý</button></div>
    {open && <DetailDrawer title="Popup kiểm thử" className="sc-order-dialog" busy={busy} onClose={() => { setOpen(''); setNested(false) }}>
      <p>Nội dung bên trong popup</p>
      {open === 'form' && <><ModalFormState value={{ name, rows }} /><label>Tên tiệm kiểm thử<input className="sc-input" value={name} onChange={(event) => setName(event.target.value)} /></label><button className="sc-button" onClick={() => setRows((items) => [...items, ''])}>Thêm dòng trống</button><p>Số dòng: {rows.length}</p><button type="button" className="sc-button" data-modal-close onClick={() => setOpen('')}>Đóng form</button></>}
      {busy && <button className="sc-button" onClick={() => setBusy(false)}>Kết thúc kiểm thử xử lý</button>}
      <button className="sc-button" onClick={() => setNested(true)}>Mở popup con</button>
      {nested && <ModalSurface className="sc-chat-entry-dialog" label="Popup con" onClose={() => setNested(false)}>{({ requestClose }) => <><h2>Popup con</h2><p>Nội dung popup con</p><button className="sc-button" onClick={requestClose}>Đóng popup con</button></>}</ModalSurface>}
    </DetailDrawer>}
  </main>
}
createRoot(document.getElementById('root')).render(<Preview />)
