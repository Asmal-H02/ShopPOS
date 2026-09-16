import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function Stock() {
  const { user } = useAuth()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [costPerKg, setCostPerKg] = useState('')
  const [action, setAction] = useState('restock')
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'admin'

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/products/')
      setProducts(response.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to load stock information. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const getStockStatus = (product) => {
    if (product.stock <= 0) {
      return 'Out of Stock'
    }

    if (product.stock <= product.reorder_level) {
      return 'Low Stock'
    }

    return 'In Stock'
  }

  const formatStock = (product) => {
  if (product.product_type === 'weight') {
    return `${Number(product.stock || 0).toFixed(3)} kg`
  }

  if (product.product_type === 'liquid') {
    return `${Number(product.stock || 0).toFixed(3)} L`
  }

  return Math.round(Number(product.stock || 0))
}

  const formatReorderLevel = (product) => {
  if (product.product_type === 'weight') {
    return `${Number(product.reorder_level || 0).toFixed(3)} kg`
  }

  if (product.product_type === 'liquid') {
    return `${Number(product.reorder_level || 0).toFixed(3)} L`
  }

  return Math.round(Number(product.reorder_level || 0))
}

  const formatPreviewStock = (value, product) => {
  if (product.product_type === 'weight') {
    return `${Number(value || 0).toFixed(3)} kg`
  }

  if (product.product_type === 'liquid') {
    return `${Number(value || 0).toFixed(3)} L`
  }

  return Math.round(Number(value || 0))
}

  const openStockModal = (
  product,
  selectedAction = 'restock'
) => {
  setSelectedProduct(product)
  setQuantity('')
  setCostPerKg(
    product.product_type === 'liquid'
      ? product.cost_price || ''
      : ''
  )
  setAction(selectedAction)
  setShowModal(true)
  setError('')
}

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setSelectedProduct(null)
    setQuantity('')
  }

  const handleStockUpdate = async (event) => {
  event.preventDefault()

  const amount = Number(quantity)

  if (!Number.isFinite(amount) || amount <= 0) {
    setError('Please enter a valid positive quantity.')
    return
  }

  if (
    selectedProduct?.product_type === 'unit' &&
    !Number.isInteger(amount)
  ) {
    setError(
      'Unit products must use whole-number quantities.'
    )
    return
  }

  if (
  selectedProduct?.product_type === 'liquid' &&
  action === 'restock'
) {
  const cost = Number(costPerKg)

  if (!Number.isFinite(cost) || cost <= 0) {
    setError(
      'Please enter a valid cost price per kg.'
    )
    return
  }
}

  if (
    selectedProduct?.product_type === 'liquid' &&
    action === 'reduce' &&
    amount > selectedProduct.stock
  ) {
    setError(
      `Cannot reduce stock by ${amount.toFixed(3)} L. Current stock is only ${Number(
        selectedProduct.stock || 0
      ).toFixed(3)} L.`
    )
    return
  }

  if (
    action === 'reduce' &&
    selectedProduct &&
    selectedProduct.product_type !== 'liquid' &&
    amount > selectedProduct.stock
  ) {
    setError(
      `Cannot reduce stock by ${formatPreviewStock(
        amount,
        selectedProduct
      )}. Current stock is only ${formatPreviewStock(
        selectedProduct.stock,
        selectedProduct
      )}.`
    )
    return
  }

  try {
    setSaving(true)
    setError('')

    if (
      action === 'restock' &&
      selectedProduct.product_type === 'liquid'
    ) {
      await api.patch(
      `/products/${selectedProduct.id}/liquid-restock`,
      {
      quantity_kg: amount,
      cost_per_kg: Number(costPerKg),
      }
)
    } else if (action === 'restock') {
      await api.patch(
        `/products/${selectedProduct.id}/restock`,
        {
          quantity: amount,
        }
      )
    } else {
      await api.patch(
        `/products/${selectedProduct.id}/stock`,
        {
          quantity: amount,
        }
      )
    }

    closeModal()
    await loadProducts()
  } catch (err) {
    console.error(err)

    setError(
      err.response?.data?.detail ||
        'Unable to update stock. Please try again.'
    )
  } finally {
    setSaving(false)
  }
}

  const filteredProducts = products.filter((product) => {
    const searchValue = search.toLowerCase().trim()

    const productName =
      product.name?.toLowerCase() || ''

    const barcode =
      product.barcode?.toLowerCase() || ''

    const matchesSearch =
      !searchValue ||
      productName.includes(searchValue) ||
      barcode.includes(searchValue)

    const status = getStockStatus(product)

    const matchesFilter =
      filter === 'all' ||
      (filter === 'low' && status === 'Low Stock') ||
      (filter === 'out' && status === 'Out of Stock') ||
      (filter === 'good' && status === 'In Stock')

    return matchesSearch && matchesFilter
  })

  const totalProducts = products.length

  const lowStockProducts = products.filter(
    (product) =>
      product.stock > 0 &&
      product.stock <= product.reorder_level
  ).length

  const outOfStockProducts = products.filter(
    (product) => product.stock <= 0
  ).length

  const totalUnitStock = products
  .filter((product) => product.product_type === 'unit')
  .reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  )

const totalWeightStock = products
  .filter((product) => product.product_type === 'weight')
  .reduce(
    (total, product) => total + Number(product.stock || 0),
    0
)
const totalLiquidStock = products
  .filter((product) => product.product_type === 'liquid')
  .reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  )

  return (
    <div className="stock-page">
      <div className="stock-heading">
        <div>
          <p className="page-eyebrow">INVENTORY CONTROL</p>

          <h1>Stock Management</h1>

          <p>
            Monitor inventory levels and keep your products
            properly stocked.
          </p>
        </div>
      </div>

      {error && (
        <div className="stock-error">
          {error}
        </div>
      )}

      <div className="stock-summary">
        <div className="stock-summary-card">
          <div className="stock-summary-icon blue">
            ▦
          </div>

          <div>
            <span>Total Products</span>
            <strong>{totalProducts}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon orange">
            !
          </div>

          <div>
            <span>Low Stock</span>
            <strong>{lowStockProducts}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon red">
            ×
          </div>

          <div>
            <span>Out of Stock</span>
            <strong>{outOfStockProducts}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
        <div className="stock-summary-icon green">
         #
        </div>

        <div>
        <span>Total Stock</span>

        <strong>
          {[
            totalUnitStock > 0
            ? `${totalUnitStock} units`
            : null,
            totalWeightStock > 0
            ? `${totalWeightStock.toFixed(3)} kg`
            : null,
            totalLiquidStock > 0
            ? `${totalLiquidStock.toFixed(3)} L`
            : null,
          ]
            .filter(Boolean)
            .join(' + ') || '0'}
        </strong>
      </div>
      </div>
      </div>

      <div className="stock-card">
        <div className="stock-toolbar">
          <div className="stock-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search product or barcode..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="stock-filters">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>

            <button
              className={filter === 'good' ? 'active' : ''}
              onClick={() => setFilter('good')}
            >
              In Stock
            </button>

            <button
              className={filter === 'low' ? 'active' : ''}
              onClick={() => setFilter('low')}
            >
              Low Stock
            </button>

            <button
              className={filter === 'out' ? 'active' : ''}
              onClick={() => setFilter('out')}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {loading ? (
          <div className="stock-state">
            Loading stock information...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="stock-empty">
            <div className="stock-empty-icon">
              ▤
            </div>

            <h3>No products found</h3>

            <p>
              Try changing your search or stock filter.
            </p>
          </div>
        ) : (
          <div className="stock-table-wrapper">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Barcode</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Status</th>

                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product)

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="stock-product-cell">
                          <div className="stock-product-icon">
                            ▦
                          </div>

                          <div>
                            <strong>{product.name}</strong>

                            <span>
                              Product #{product.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="category-badge">
                          {product.product_type === 'weight'
                          ? 'Weight'
                          : product.product_type === 'liquid'
                          ? 'Liquid'
                          : 'Unit'}
                      </span>
                      </td>

                      <td>
                        <span className="stock-barcode">
                          {product.barcode || '—'}
                        </span>
                      </td>

                      <td>
                        <strong className="stock-value">
                          {formatStock(product)}
                        </strong>
                      </td>

                      <td>
                        <span className="reorder-value">
                          {formatReorderLevel(product)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`stock-status ${status
                            .toLowerCase()
                            .replaceAll(' ', '-')}`}
                        >
                          {status}
                        </span>
                      </td>

                      {isAdmin && (
                        <td>
                          <div className="stock-actions">
                            <button
                              className="table-action restock"
                              onClick={() =>
                                openStockModal(
                                  product,
                                  'restock'
                                )
                              }
                            >
                              Restock
                            </button>

                            <button
                              className="table-action reduce"
                              onClick={() =>
                                openStockModal(
                                  product,
                                  'reduce'
                                )
                              }
                            >
                              Reduce
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="stock-modal">
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  STOCK ADJUSTMENT
                </p>

                <h2>
                  {action === 'restock'
                    ? 'Restock Product'
                    : 'Reduce Stock'}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <div className="stock-modal-product">
              <div className="stock-product-icon">
                ▦
              </div>

              <div>
                <strong>
                  {selectedProduct.name}
                </strong>

                <span>
                  Current stock:{' '}
                  {formatStock(selectedProduct)}
                </span>
              </div>
            </div>

            <form
              className="stock-form"
              onSubmit={handleStockUpdate}
            >
              <div className="form-group">
  <label htmlFor="stock-quantity">
  {selectedProduct.product_type === 'liquid'
    ? action === 'restock'
      ? 'Quantity (kg)'
      : 'Quantity (litres)'
    : selectedProduct.product_type === 'weight'
      ? 'Quantity (kg)'
      : 'Quantity'}
</label>

  <div className="input-prefix">
    {(
  selectedProduct.product_type === 'weight' ||
  (
    selectedProduct.product_type === 'liquid' &&
    action === 'restock'
  )
) && (
  <span>kg</span>
)}

    <input
      id="stock-quantity"
      type="number"
      min="0.001"
      step="0.001"
      value={quantity}
      onChange={(event) =>
        setQuantity(event.target.value)
      }
      placeholder={
  selectedProduct.product_type === 'liquid'
    ? action === 'restock'
      ? 'e.g. 5.000'
      : 'e.g. 0.350'
    : selectedProduct.product_type === 'weight'
      ? 'e.g. 2.500'
      : 'Enter quantity'
}
      autoFocus
      required
    />
  </div>
</div>

{selectedProduct.product_type === 'liquid' &&
  action === 'restock' && (
    <div className="form-group">
      <label htmlFor="cost-per-kg">
        Cost Price / kg
      </label>

      <div className="input-prefix">
        <span>Rs.</span>

        <input
          id="cost-per-kg"
          type="number"
          min="0.01"
          step="0.01"
          value={costPerKg}
          onChange={(event) =>
            setCostPerKg(event.target.value)
          }
          placeholder="e.g. 1000.00"
          required
        />
      </div>

      <small className="form-helper">
        Enter the current wholesale cost per kilogram.
      </small>
    </div>
  )}

              <div className="stock-action-info">
                {action === 'restock' ? (
  <>
    Stock will increase from{' '}
    <strong>
      {formatPreviewStock(
        selectedProduct.stock,
        selectedProduct
      )}
    </strong>{' '}
    to{' '}
    <strong>
      {formatPreviewStock(
        selectedProduct.stock +
          (selectedProduct.product_type === 'liquid'
            ? (Number(quantity) || 0) * 1.082
            : Number(quantity) || 0),
        selectedProduct
      )}
    </strong>

    {selectedProduct.product_type === 'liquid' &&
      Number(quantity) > 0 && (
        <div className="stock-conversion-note">
          {Number(quantity).toFixed(3)} kg × 1.082 ={' '}
          <strong>
            {(Number(quantity) * 1.082).toFixed(3)} L
          </strong>
        </div>
      )}
  </>
) : (
                  <>
                    Stock will decrease from{' '}
                    <strong>
                      {formatPreviewStock(
                        selectedProduct.stock,
                        selectedProduct
                      )}
                    </strong>{' '}
                    to{' '}
                    <strong>
                      {formatPreviewStock(
                        Math.max(
                          0,
                          selectedProduct.stock -
                            (Number(quantity) || 0)
                        ),
                        selectedProduct
                      )}
                    </strong>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving ||
                    !quantity ||
                    Number(quantity) <= 0
                  }
                >
                  {saving
                    ? 'Updating...'
                    : action === 'restock'
                      ? 'Restock Product'
                      : 'Reduce Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Stock