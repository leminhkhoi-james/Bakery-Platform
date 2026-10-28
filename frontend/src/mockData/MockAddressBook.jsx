import AddressFields from '../components/orders/AddressFields.jsx'
import { emptyAddress, formatAddress, addressTitle } from './addressModels.js'
import { useState, useSyncExternalStore } from 'react'
import { useAuth } from '../context/useAuth.js'
import { demoRuntime } from './runtime.js'
import { loadOrders } from '../services/orderService.js'
import { useCatalogResource } from '../hooks/useCatalogResource.js'
import { ApiState, ApiErrorMessage, buttonClass } from '../components/management/ApiState.jsx'
import { ADDRESS_BLOCKER } from '../services/checkoutService.js'
import ConfirmAction from '../components/common/ConfirmAction.jsx'

export default function MockAddressBook() {
  const orders = useCatalogResource(loadOrders, { scope: 'mine', page: 1, size: 1 })
  return <ApiState resource={orders}>{orders.status === 'ready' && (demoRuntime.sources.get('/orders:scope=mine') === 'demo' ? <AddressBook /> : <p>{ADDRESS_BLOCKER}</p>)}</ApiState>
}
function AddressBook() {
  useSyncExternalStore(demoRuntime.subscribe, demoRuntime.getSnapshot, demoRuntime.getSnapshot)
  const { user } = useAuth()
  const [selected, setSelected] = useState(null), [error, setError] = useState(null), [deleting, setDeleting] = useState(null), [notice, setNotice] = useState('')
  const addresses = demoRuntime.store.state.addresses.filter((address) => address.customerId === user.id)
  function mutate(method, path, body) {
    try { demoRuntime.runLocal(path, method, body); setSelected(null); setDeleting(null); setError(null); setNotice(method === 'DELETE' ? 'Đã xóa địa chỉ.' : 'Đã lưu địa chỉ nhận bánh.') }
    catch (failure) { setError(failure); setNotice('') }
  }
  return <section className="space-y-4">
    <h2 className="text-xl font-bold text-primary">Địa chỉ nhận bánh</h2>
    <p className="text-xs text-on-surface-variant">Quản lý địa chỉ nhận bánh của bạn.</p>
    <button className={buttonClass} disabled={!!selected} onClick={() => { setSelected(emptyAddress(user, addresses.length === 0)); setError(null); setNotice(''); setDeleting(null) }}>Thêm địa chỉ</button>
    {selected && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mutate(selected.id ? 'PATCH' : 'POST', '/sample-addresses' + (selected.id ? '/' + selected.id : ''), selected) }}><h3 className="font-bold">{selected.id ? 'Sửa địa chỉ' : 'Địa chỉ mới'}</h3><AddressFields value={selected} onChange={setSelected} /><div className="flex flex-wrap gap-3"><button className={buttonClass}>Lưu địa chỉ</button><button type="button" onClick={() => { setSelected(null); setError(null) }}>Hủy</button></div></form>}
    {error && <ApiErrorMessage error={error} />}{notice && <p role="status" className="text-sm text-primary">{notice}</p>}
    {!addresses.length && !selected && <p className="rounded-xl bg-surface-container-low p-4 text-sm">Bạn chưa có địa chỉ nhận bánh. Thêm địa chỉ đầu tiên để tiếp tục đặt hàng.</p>}
    {addresses.map((address) => <article className="rounded-xl border border-outline-variant/30 p-4 space-y-2" key={address.id}>
      <h3 className="font-bold">{addressTitle(address)}{address.primary && <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Mặc định</span>}</h3>
      <p>{address.recipientName} · {address.recipientPhone}</p><p className="break-words">{formatAddress(address)}</p>{address.deliveryNote && <p className="text-sm text-on-surface-variant">{address.deliveryNote}</p>}
      <div className="flex flex-wrap gap-4"><button disabled={!!selected} className="underline disabled:opacity-40" onClick={() => { setSelected({ ...address }); setDeleting(null); setError(null); setNotice('') }}>Sửa địa chỉ</button>{!address.primary && <button disabled={!!selected} className="underline disabled:opacity-40" onClick={() => mutate('PATCH', '/sample-addresses/' + address.id, { primary: true })}>Đặt làm mặc định</button>}<button disabled={!!selected} className="underline disabled:opacity-40" onClick={() => { setDeleting(address.id); setError(null); setNotice('') }}>Xóa địa chỉ</button></div>
      {deleting === address.id && <div><ConfirmAction label="Xác nhận xóa địa chỉ" description="Xóa địa chỉ này khỏi sổ địa chỉ? Địa chỉ trong các đơn đã đặt vẫn được giữ nguyên." onConfirm={() => mutate('DELETE', '/sample-addresses/' + address.id)} /><button type="button" className="mt-2 text-sm underline" onClick={() => setDeleting(null)}>Giữ lại địa chỉ</button></div>}
    </article>)}
  </section>
}
