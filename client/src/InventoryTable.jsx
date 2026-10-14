import { useMemo, useState } from 'react'
import { categories } from './store'

function statusOf(product) {
  if (product.qty <= 0) return 'Out of stock'
  if (product.qty <= product.reorder) return 'Low stock'
  return 'In stock'
}

function statusColors(status) {
  if (status === 'Out of stock') return { bg: '#FBDDDB', fg: '#8F1D17', bar: '#C0392B' }
  if (status === 'Low stock') return { bg: '#FCEFC7', fg: '#7A4B00', bar: '#C98A00' }
  return { bg: '#DDF3E8', fg: '#0B5B3E', bar: '#0E6B57' }
}

function formatNumber(value) {
  return Number(value).toLocaleString('en-PH')
}

function SortButton({ active, direction, label, onClick }) {
  return <button className="sort-button" onClick={onClick} type="button">{label}<span aria-hidden="true">{active ? direction === 'asc' ? '↑' : '↓' : ''}</span></button>
}

function Icon({ d, size = 16, strokeWidth = 2 }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={size}><path d={d} /></svg>
}

export default function InventoryTable({ onAdjust, onDelete, onEdit, pendingOrderProductIds = [], products, suppliers }) {
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [confirmId, setConfirmId] = useState(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return products.filter((product) => {
      if (category !== 'All' && product.category !== category) return false
      const productStatus = statusOf(product)
      if (status !== 'All' && status !== productStatus) return false
      return !normalized || product.name.toLowerCase().includes(normalized) || product.sku.toLowerCase().includes(normalized)
    }).sort((a, b) => {
      const compare = sortKey === 'qty'
        ? a.qty - b.qty
        : sortKey === 'price'
          ? a.price - b.price
          : a.name.localeCompare(b.name)
      return compare * (sortDirection === 'asc' ? 1 : -1)
    })
  }, [category, products, query, sortDirection, sortKey, status])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pendingProductSet = new Set(pendingOrderProductIds)
  const start = (currentPage - 1) * pageSize
  const visible = filtered.slice(start, start + pageSize)
  const pageButtons = [...new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1])]
    .filter((number) => number >= 1 && number <= pageCount)
    .sort((a, b) => a - b)

  function changeSort(key) {
    setSortDirection((direction) => sortKey === key ? (direction === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortKey(key)
    setPage(1)
    setConfirmId(null)
  }

  function changeFilter(setter, value) {
    setter(value)
    setPage(1)
    setConfirmId(null)
  }

  return (
    <section aria-label="Products" className="panel products-panel">
      <div className="products-toolbar">
        <div className="filter-row">
          <div className="products-title"><h2>All products</h2><p>{formatNumber(products.length)} products in the catalog</p></div>
          <label className="field search-field">Search<input onChange={(event) => changeFilter(setQuery, event.target.value)} placeholder="Name or SKU" type="search" value={query} /></label>
          <label className="field status-field">Status
            <select onChange={(event) => changeFilter(setStatus, event.target.value)} value={status}>
              <option value="All">All statuses</option>
              <option>In stock</option>
              <option>Low stock</option>
              <option>Out of stock</option>
            </select>
          </label>
        </div>
        <div aria-label="Filter by category" className="category-chips">
          {['All', ...categories].map((item) => (
            <button aria-pressed={category === item} className={`category-chip${category === item ? ' selected' : ''}`} key={item} onClick={() => changeFilter(setCategory, item)} type="button">{item}</button>
          ))}
        </div>
      </div>

      <div className="table-scroll">
        <div className="product-table">
          <div className="table-header table-grid">
            <div><SortButton label="Product" active={sortKey === 'name'} direction={sortDirection} onClick={() => changeSort('name')} /></div>
            <div>Category</div>
            <div><SortButton label="Stock" active={sortKey === 'qty'} direction={sortDirection} onClick={() => changeSort('qty')} /></div>
            <div>Status</div>
            <div className="align-right"><SortButton label="Price" active={sortKey === 'price'} direction={sortDirection} onClick={() => changeSort('price')} /></div>
            <div className="align-center">Actions</div>
          </div>
          {visible.map((product) => {
            const productStatus = statusOf(product)
            const colors = statusColors(productStatus)
            const supplier = suppliers.find((item) => item.id === product.supplierId)
            const hasPendingOrder = pendingProductSet.has(product.id)
            return (
              <div className="product-row table-grid" key={product.id}>
                <div>
                  <div className="product-name">{product.name}</div>
                  <div className="sku">{product.sku}</div>
                  {onEdit && <button className="edit-product-link" onClick={() => onEdit(product)} type="button">Edit details</button>}
                </div>
                <div className="product-category">{product.category}{supplier && <div className="table-supplier">{supplier.name}</div>}</div>
                <div>
                  <div className="quantity-line"><strong>{formatNumber(product.qty)}</strong><span>/ reorder at {formatNumber(product.reorder)}</span></div>
                  <div className="quantity-track"><span style={{ backgroundColor: colors.bar, width: `${Math.min(100, Math.round(product.qty / Math.max(1, product.reorder * 3) * 100))}%` }} /></div>
                </div>
                <div><span className="status-badge" style={{ backgroundColor: colors.bg, color: colors.fg }}>{productStatus}</span></div>
                <div className="product-price">₱{formatNumber(product.price)}</div>
                <div className="row-actions">
                  <button aria-label={`Remove one unit from ${product.name}`} className="row-action" disabled={product.qty === 0} onClick={() => { setConfirmId(null); onAdjust(product, -1) }} type="button"><Icon d="M5 12h14" strokeWidth={2.4} /></button>
                  <button aria-label={`Add one unit to ${product.name}`} className="row-action" onClick={() => { setConfirmId(null); onAdjust(product, 1) }} type="button"><Icon d="M12 5v14 M5 12h14" strokeWidth={2.4} /></button>
                  <button
                    aria-label={confirmId === product.id ? `Confirm delete ${product.name}` : `Delete ${product.name}`}
                    className={`row-action delete-action${confirmId === product.id ? ' confirming' : ''}`}
                    disabled={hasPendingOrder}
                    onClick={() => {
                      if (confirmId === product.id) {
                        onDelete(product)
                        setConfirmId(null)
                      } else setConfirmId(product.id)
                    }}
                    title={hasPendingOrder ? 'Receive or cancel the pending purchase order before deleting this product.' : undefined}
                    type="button"
                  >
                    <Icon d="M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6" />
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <div className="empty-products"><strong>No products match</strong><span>Try a different search, category, or status.</span></div>}
        </div>
      </div>

      <div className="pagination">
        <div className="pagination-meta">
          <div className="range-label">
            {filtered.length ? `Showing ${start + 1}–${start + visible.length} of ${filtered.length} products` : 'Showing 0 products'}
          </div>
          <label className="rows-label">Rows per page
            <select onChange={(event) => { setPageSize(Number(event.target.value) || 8); setPage(1); setConfirmId(null) }} value={pageSize}>
              {[5, 8, 12].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        </div>
        <nav aria-label="Pagination" className="page-controls">
          <button className="page-direction" disabled={currentPage <= 1} onClick={() => { setPage((value) => Math.max(1, value - 1)); setConfirmId(null) }} type="button"><Icon d="M15 18l-6-6 6-6" strokeWidth={2.4} />Previous</button>
          {pageButtons.map((number, index) => (
            <span className="page-number-wrap" key={number}>
              {index > 0 && number - pageButtons[index - 1] > 1 && <span aria-hidden="true" className="page-gap">…</span>}
              <button aria-current={number === currentPage ? 'page' : undefined} aria-label={`Page ${number}`} className={`page-number${number === currentPage ? ' current' : ''}`} onClick={() => { setPage(number); setConfirmId(null) }} type="button">{number}</button>
            </span>
          ))}
          <button className="page-direction" disabled={currentPage >= pageCount} onClick={() => { setPage((value) => Math.min(pageCount, value + 1)); setConfirmId(null) }} type="button">Next<Icon d="M9 18l6-6-6-6" strokeWidth={2.4} /></button>
        </nav>
      </div>
    </section>
  )
}
