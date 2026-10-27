import MockAddressBook from '../../src/mockData/MockAddressBook.jsx'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { AuthContext } from '../../src/context/useAuth.js'
import { installDemoFallback, demoRuntime } from '../../src/mockData/runtime.js'
import { demoId } from '../../src/mockData/seed.js'
import VerifiedCheckout from '../../src/components/orders/VerifiedCheckout.jsx'
import '../../src/index.css'
import '../../src/styles/artisan-workspace.css'
import '../../src/styles/design-system.css'
let currentUser = null
installDemoFallback(() => currentUser)
const first = { id: 'ee000000-0000-4000-8000-000000000501', displayName: 'Khách mẫu', roles: ['CUSTOMER'] }
const second = { ...first, id: 'ee000000-0000-4000-8000-000000000502', displayName: 'Khách thứ hai' }
function Fixture() {
  const [user, setUser] = useState(null), [book, setBook] = useState(false)
  const login = (value, empty = false) => { if (empty) { demoRuntime.store.bind(value); demoRuntime.store.state.addresses = demoRuntime.store.state.addresses.filter((a) => a.customerId !== value.id); demoRuntime.store.save() } currentUser = value; setUser(value) }
  return <AuthContext.Provider value={{ user }}><main className="mx-auto max-w-xl space-y-4 p-5"><h1>Kiểm thử địa chỉ · fixture cô lập</h1><button className="sc-button" onClick={() => login(first, true)}>Đăng nhập khách chưa có địa chỉ</button><button className="sc-button" onClick={() => login(second)}>Đổi sang khách khác</button><button className="sc-button" disabled={!user} onClick={() => setBook(!book)}>Đổi giữa checkout và sổ địa chỉ</button><section className="sc-panel space-y-4">{book ? <MockAddressBook key={user?.id} /> : <><h2>Xác nhận đơn hàng</h2><VerifiedCheckout items={[{ id: 'fixture-item', catalogSource: 'backend', productId: demoId(100), bakeryId: demoId(10), quantity: 1, optionSelections: [], addOns: [] }]} /></>}</section></main></AuthContext.Provider>
}
createRoot(document.getElementById('root')).render(<Fixture />)
