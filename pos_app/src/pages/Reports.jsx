
import { useEffect, useState } from 'react'
import api from '../services/api'

function Reports() {
  const now = new Date()

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [daily, setDaily] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [productSales, setProductSales] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = async () => {
    try {
      setLoading(true)
      setError('')

      const [dailyResponse, monthlyResponse, productResponse] =
        await Promise.all([
          api.get('/sales/summary/daily'),
          api.get('/sales/summary/monthly', {
            params: {
              year,
              month,
            },
          }),
          api.get('/sales/products/monthly', {
            params: {
              year,
              month,
            },
          }),
        ])

      setDaily(dailyResponse.data)
      setMonthly(monthlyResponse.data)
      setProductSales(productResponse.data.products || [])
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to load reports. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [year, month])

  const formatCurrency = (value) => {
    return `Rs. ${Number(value || 0).toFixed(2)}`
  }

  const formatQuantity = (product) => {
    const quantity = Number(product.quantity_sold || 0)

    if (product.product_type === 'weight') {
      return `${quantity.toFixed(3)} kg`
    }

    return Math.round(quantity)
  }

  const formatMonth = () => {
    return new Date(year, month - 1, 1).toLocaleString(
      'en-US',
      {
        month: 'long',
        year: 'numeric',
      }
    )
  }

  return (
    <div className="reports-page">

      {/* Header */}
      <div className="reports-heading">
        <div>
          <p className="page-eyebrow">BUSINESS REPORTING</p>

          <h1>Reports</h1>

          <p>
            Review sales performance, revenue and product
            profitability.
          </p>
        </div>

        <div className="report-period">
          <label>
            Month
            <select
              value={month}
              onChange={(event) =>
                setMonth(Number(event.target.value))
              }
            >
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
            </select>
          </label>

          <label>
            Year
            <select
              value={year}
              onChange={(event) =>
                setYear(Number(event.target.value))
              }
            >
              {Array.from(
                { length: 6 },
                (_, index) => now.getFullYear() - index
              ).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="reports-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="reports-loading">
          Loading reports...
        </div>
      ) : (
        <>
          {/* Daily Summary */}
          <section className="report-section">
            <div className="report-section-heading">
              <div>
                <p className="page-eyebrow">TODAY</p>
                <h2>Daily Summary</h2>
              </div>

              <span>
                {daily?.date || '-'}
              </span>
            </div>

            <div className="report-summary-grid">

              <div className="report-stat">
                <span>Transactions</span>
                <strong>
                  {daily?.total_sales || 0}
                </strong>
              </div>

              <div className="report-stat">
                <span>Revenue</span>
                <strong>
                  {formatCurrency(daily?.total_amount)}
                </strong>
              </div>

              <div className="report-stat">
                <span>Total Cost</span>
                <strong>
                  {formatCurrency(daily?.total_cost)}
                </strong>
              </div>

              <div className="report-stat profit">
                <span>Profit</span>
                <strong>
                  {formatCurrency(daily?.total_profit)}
                </strong>
              </div>

              <div className="report-stat">
                <span>Cash Received</span>
                <strong>
                  {formatCurrency(daily?.total_cash)}
                </strong>
              </div>

              <div className="report-stat">
                <span>Change Given</span>
                <strong>
                  {formatCurrency(daily?.total_change)}
                </strong>
              </div>

            </div>
          </section>

          {/* Monthly Summary */}
          <section className="report-section">
            <div className="report-section-heading">
              <div>
                <p className="page-eyebrow">
                  SELECTED PERIOD
                </p>

                <h2>Monthly Summary</h2>
              </div>

              <span>
                {formatMonth()}
              </span>
            </div>

            <div className="report-summary-grid">

              <div className="report-stat">
                <span>Transactions</span>
                <strong>
                  {monthly?.total_sales || 0}
                </strong>
              </div>

              <div className="report-stat">
                <span>Revenue</span>
                <strong>
                  {formatCurrency(
                    monthly?.total_amount
                  )}
                </strong>
              </div>

              <div className="report-stat">
                <span>Total Cost</span>
                <strong>
                  {formatCurrency(
                    monthly?.total_cost
                  )}
                </strong>
              </div>

              <div className="report-stat profit">
                <span>Profit</span>
                <strong>
                  {formatCurrency(
                    monthly?.total_profit
                  )}
                </strong>
              </div>

              <div className="report-stat">
                <span>Cash Received</span>
                <strong>
                  {formatCurrency(
                    monthly?.total_cash
                  )}
                </strong>
              </div>

              <div className="report-stat">
                <span>Change Given</span>
                <strong>
                  {formatCurrency(
                    monthly?.total_change
                  )}
                </strong>
              </div>

            </div>
          </section>

          {/* Product Performance */}
          <section className="report-section">

            <div className="report-section-heading">
              <div>
                <p className="page-eyebrow">
                  PRODUCT PERFORMANCE
                </p>

                <h2>Product Sales</h2>
              </div>

              <span>
                {productSales.length} product
                {productSales.length !== 1
                  ? 's'
                  : ''} sold
              </span>
            </div>

            {productSales.length === 0 ? (
              <div className="reports-empty">
                <div className="reports-empty-icon">
                  ▥
                </div>

                <h3>
                  No product sales
                </h3>

                <p>
                  There are no completed sales for{' '}
                  {formatMonth()}.
                </p>
              </div>
            ) : (
              <div className="reports-table-wrapper">
                <table className="reports-table">

                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty Sold</th>
                      <th>Revenue</th>
                      <th>Cost</th>
                      <th>Profit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {productSales
                      .slice()
                      .sort(
                        (a, b) =>
                          b.total_profit -
                          a.total_profit
                      )
                      .map((product) => (
                        <tr
                          key={product.product_id}
                        >
                          <td>
                            <strong>
                              {product.product_name}
                            </strong>
                          </td>

                          <td>
                            {formatQuantity(product)}
                          </td>

                          <td>
                            {formatCurrency(
                              product.total_revenue
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              product.total_cost
                            )}
                          </td>

                          <td>
                            <strong className="report-profit">
                              {formatCurrency(
                                product.total_profit
                              )}
                            </strong>
                          </td>
                        </tr>
                      ))}
                  </tbody>

                </table>
              </div>
            )}

          </section>
        </>
      )}

    </div>
  )
}

export default Reports


