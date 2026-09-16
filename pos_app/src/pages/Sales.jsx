import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

function Sales() {
  const [sales, setSales] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [loadingSale, setLoadingSale] = useState(false)

  const loadSales = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/sales/')
      setSales(response.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to load sales. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSales()
  }, [])

  const filteredSales = useMemo(() => {
    const value = search.trim().toLowerCase()

    if (!value) {
      return sales
    }

    return sales.filter((sale) =>
      String(sale.sale_id).includes(value)
    )
  }, [sales, search])

  const openSale = async (saleId) => {
    try {
      setLoadingSale(true)
      setError('')

      const response = await api.get(`/sales/${saleId}`)
      setSelectedSale(response.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to load sale details.'
      )
    } finally {
      setLoadingSale(false)
    }
  }

  const closeSale = () => {
    setSelectedSale(null)
  }

  const printReceipt = async (saleId) => {
    try {
      setError('')

      const response = await api.get(
        `/sales/${saleId}/receipt`,
        {
          responseType: 'text',
        }
      )

      const printWindow = window.open(
        '',
        '_blank',
        'width=420,height=700'
      )

      if (!printWindow) {
        setError(
          'Please allow pop-ups to print the receipt.'
        )
        return
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt #${String(saleId).padStart(6, '0')}</title>

            <style>
              @page {
                margin: 10mm;
              }

              body {
                margin: 0;
                padding: 10px;
                background: #ffffff;
                color: #111827;
                font-family: "Courier New", monospace;
              }

              pre {
                margin: 0;
                white-space: pre-wrap;
                font-size: 12px;
                line-height: 1.4;
              }
            </style>
          </head>

          <body>
            <pre>${response.data}</pre>
          </body>
        </html>
      `)

      printWindow.document.close()

      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to print the receipt.'
      )
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleString()
  }

  const formatQuantity = (item) => {
    if (item.product_type === 'weight') {
      return `${Number(item.quantity).toFixed(3)} kg`
    }

    if (item.product_type === 'liquid') {
      return `${Number(item.quantity).toFixed(0)} × ${item.volume_ml}ml`
    }

    return Number(item.quantity).toFixed(0)
  }

  const formatPrice = (item) => {
    const price = Number(item.unit_price).toFixed(2)

    if (item.product_type === 'weight') {
      return `Rs. ${price} / kg`
    }

    if (item.product_type === 'liquid') {
      return `Rs. ${price} / ${item.volume_ml}ml`
    }

    return `Rs. ${price}`
  }

  const formatCost = (item) => {
    const cost = Number(item.cost_price).toFixed(2)

    if (item.product_type === 'weight') {
      return `Rs. ${cost} / kg`
    }

    if (item.product_type === 'liquid') {
      return `Rs. ${cost} / ${item.volume_ml}ml`
    }

    return `Rs. ${cost}`
  }

  return (
    <div className="sales-page">
      <div className="sales-heading">
        <div>
          <p className="page-eyebrow">SALES MANAGEMENT</p>

          <h1>Sales</h1>

          <p>
            View completed transactions and individual sale details.
          </p>
        </div>

        <div className="sales-count">
          <span>Total Sales</span>
          <strong>{sales.length}</strong>
        </div>
      </div>

      {error && (
        <div className="sales-error">
          {error}
        </div>
      )}

      <section className="sales-card">
        <div className="sales-card-header">
          <div>
            <h2>Transactions</h2>

            <span>
              {filteredSales.length} transaction
              {filteredSales.length !== 1 ? 's' : ''} found
            </span>
          </div>

          <div className="sales-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search by sale ID..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="sales-state">
            Loading sales...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="sales-empty">
            <div className="sales-empty-icon">
              ↗
            </div>

            <h3>No sales found</h3>

            <p>
              Completed transactions will appear here.
            </p>
          </div>
        ) : (
          <div className="sales-table-wrapper">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Sale</th>
                  <th>Date & Time</th>
                  <th>Total</th>
                  <th>Cash Received</th>
                  <th>Change</th>
                  <th>Items</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.map((sale) => {
                  const itemCount = sale.items.length

                  return (
                    <tr key={sale.sale_id}>
                      <td>
                        <strong>
                          #{String(sale.sale_id).padStart(6, '0')}
                        </strong>
                      </td>

                      <td>
                        <span className="sale-date">
                          {formatDate(sale.created_at)}
                        </span>
                      </td>

                      <td>
                        <strong className="sale-total">
                          Rs.{' '}
                          {Number(
                            sale.total_amount
                          ).toFixed(2)}
                        </strong>
                      </td>

                      <td>
                        Rs.{' '}
                        {Number(
                          sale.amount_paid
                        ).toFixed(2)}
                      </td>

                      <td>
                        Rs.{' '}
                        {Number(sale.change || 0).toFixed(2)}
                      </td>

                      <td>
                        <span className="item-count-badge">
                          {itemCount}
                        </span>
                      </td>

                      <td>
                        <button
                          className="view-sale-button"
                          onClick={() =>
                            openSale(sale.sale_id)
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {loadingSale && (
        <div className="sale-modal-overlay">
          <div className="sale-modal-loading">
            Loading sale details...
          </div>
        </div>
      )}

      {selectedSale && (
        <div
          className="sale-modal-overlay"
          onClick={closeSale}
        >
          <div
            className="sale-details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="sale-details-header">
              <div>
                <p className="page-eyebrow">
                  SALE DETAILS
                </p>

                <h2>
                  #
                  {String(
                    selectedSale.sale_id
                  ).padStart(6, '0')}
                </h2>

                <span>
                  {formatDate(
                    selectedSale.created_at
                  )}
                </span>
              </div>

              <button
                className="sale-modal-close"
                onClick={closeSale}
              >
                ×
              </button>
            </div>

            <div className="sale-summary-grid">
              <div>
                <span>Total</span>

                <strong>
                  Rs.{' '}
                  {Number(
                    selectedSale.total_amount
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  {selectedSale.payment_method === 'credit'
                    ? 'Credit Sale'
                    : 'Cash Received'}
                </span>

                <strong>
                  Rs.{' '}
                  {Number(
                    selectedSale.amount_paid
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Change</span>

                <strong>
                  Rs.{' '}
                  {Number(
                    selectedSale.change || 0
                  ).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="sale-items-section">
              <div className="sale-items-header">
                <h3>Items</h3>

                <span>
                  {selectedSale.items.length}{' '}
                  product
                  {selectedSale.items.length !== 1
                    ? 's'
                    : ''}
                </span>
              </div>

              <div className="sale-items-table-wrapper">
                <table className="sale-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Cost</th>
                      <th>Subtotal</th>
                      <th>Profit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedSale.items.map(
                      (item, index) => (
                        <tr
                          key={`${item.product_id}-${index}`}
                        >
                          <td>
                            <strong>
                              {item.product_name}
                            </strong>
                          </td>

                          <td>
                            {formatQuantity(item)}
                          </td>

                          <td>
                            {formatPrice(item)}
                          </td>

                          <td>
                            {formatCost(item)}
                          </td>

                          <td>
                            Rs.{' '}
                            {Number(
                              item.subtotal
                            ).toFixed(2)}
                          </td>

                          <td>
                            <strong className="profit-value">
                              Rs.{' '}
                              {Number(
                                item.profit
                              ).toFixed(2)}
                            </strong>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sale-details-actions">
              <button
                className="receipt-button secondary"
                onClick={() =>
                  printReceipt(
                    selectedSale.sale_id
                  )
                }
              >
                Print Receipt
              </button>

              <button
                className="close-sale-button"
                onClick={closeSale}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales