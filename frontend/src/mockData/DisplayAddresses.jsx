import { displayRuntime } from './displayRuntime.js'
export default function DisplayAddresses() {
  if (!displayRuntime) return null
  const addresses = displayRuntime.read('/sample-addresses')
  return <section className="space-y-3">{addresses.map((address) => <article key={address.id} className="rounded-xl border border-outline-variant/30 p-3"><strong>{address.title || address.recipientName}</strong><p>{address.recipientName} · {address.recipientPhone}</p><p>{[address.addressLine, address.ward, address.district, address.city].filter(Boolean).join(', ')}</p></article>)}</section>
}
