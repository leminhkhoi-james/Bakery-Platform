export default function CatalogPagination({ meta, onPage }) {
  if (!meta) return null
  return <nav aria-label="Phân trang" className="mt-6 flex flex-wrap items-center justify-center gap-4 text-primary">
    <button className="rounded-xl border border-outline-variant/30 bg-surface px-4 py-2 disabled:opacity-40" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Trang trước</button>
    <span>{meta.pages === 0 ? 'Chưa có trang dữ liệu' : 'Trang ' + meta.page + ' / ' + meta.pages} · {meta.total} kết quả</span>
    <button className="rounded-xl border border-outline-variant/30 bg-surface px-4 py-2 disabled:opacity-40" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Trang sau</button>
  </nav>
}
