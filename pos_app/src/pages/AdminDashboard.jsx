import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [productCount, setProductCount] = useState(0)
  const [stockAlerts, setStockAlerts] = useState(null)
  const [inventory, setInventory] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const [
          summaryResponse,
          productsResponse,
          alertsResponse,
          inventoryResponse,
        ] = await Promise.all([
          api.get('/sales/summary/daily'),
          api.get('/products/'),
          api.get('/products/alerts/stock'),
          api.get('/products/inventory/value'),
        ])

        setSummary(summaryResponse.data)
        setProductCount(productsResponse.data.length)
        setStockAlerts(alertsResponse.data)
        setInventory(inventoryResponse.data)
      } catch (error) {
        console.error(error)
        setError('Unable to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const formatCurrency = (value) => {
    return `Rs. ${Number(value || 0).toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">

      {/* Page Header */}
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="page-description">
            Here's what's happening at Sirisara Stores today.
          </p>
        </div>

        <div className="dashboard-date">
          <span>Today</span>
          <strong>
            {new Date().toLocaleDateString('en-LK', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </strong>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon blue">
            $
          </div>

          <div>
            <p>Today's Sales</p>
            <h3>{formatCurrency(summary?.total_amount)}</h3>
            <span className="stat-subtext">
              Revenue generated today
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cyan">
            ↗
          </div>

          <div>
            <p>Transactions</p>
            <h3>{summary?.total_sales || 0}</h3>
            <span className="stat-subtext">
              Completed sales today
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            +
          </div>

          <div>
            <p>Today's Profit</p>
            <h3>{formatCurrency(summary?.total_profit)}</h3>
            <span className="stat-subtext">
              Estimated gross profit
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            !
          </div>

          <div>
            <p>Low Stock</p>
            <h3>{stockAlerts?.total_alerts || 0}</h3>
            <span className="stat-subtext">
              Products need attention
            </span>
          </div>
        </div>

      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">

        {/* Sales Overview */}
        <div className="dashboard-card sales-overview">

          <div className="card-header">
            <div>
              <h2>Today's Overview</h2>
              <p>Sales performance for today</p>
            </div>

            <span className="card-badge">
              Today
            </span>
          </div>

          <div className="overview-list">

            <div className="overview-row">
              <span>Total Revenue</span>
              <strong>
                {formatCurrency(summary?.total_amount)}
              </strong>
            </div>

            <div className="overview-row">
              <span>Total Cost</span>
              <strong>
                {formatCurrency(summary?.total_cost)}
              </strong>
            </div>

            <div className="overview-row profit-row">
              <span>Gross Profit</span>
              <strong>
                {formatCurrency(summary?.total_profit)}
              </strong>
            </div>

            <div className="overview-row">
              <span>Cash Received</span>
              <strong>
                {formatCurrency(summary?.total_cash)}
              </strong>
            </div>

            <div className="overview-row">
              <span>Change Given</span>
              <strong>
                {formatCurrency(summary?.total_change)}
              </strong>
            </div>

          </div>
        </div>

        {/* Inventory */}
        <div className="dashboard-card">

          <div className="card-header">
            <div>
              <h2>Inventory</h2>
              <p>Current stock overview</p>
            </div>

            <span className="inventory-icon">
              ▦
            </span>
          </div>

          <div className="inventory-total">
            <span>Total Products</span>
            <strong>{productCount}</strong>
          </div>

          <div className="inventory-value">
            <span>Inventory Value</span>
            <strong>
              {formatCurrency(inventory?.total_inventory_value)}
            </strong>
          </div>

          <Link to="/products" className="card-link">
            View products
            <span>→</span>
          </Link>

        </div>

      </div>

      {/* Low Stock */}
      <div className="dashboard-card stock-card">

        <div className="card-header">
          <div>
            <h2>Stock Alerts</h2>
            <p>Products that have reached their reorder level</p>
          </div>

          <Link to="/stock" className="card-link">
            Manage stock →
          </Link>
        </div>

        {stockAlerts?.products?.length > 0 ? (
          <div className="stock-list">

            {stockAlerts.products.slice(0, 5).map((product) => (
              <div
                className="stock-item"
                key={product.product_id}
              >
                <div>
                  <strong>{product.product_name}</strong>
                  <span>
                    Reorder level: {product.reorder_level}
                  </span>
                </div>

                <span className="stock-warning">
                  {Number(product.stock).toFixed(3)} left
                </span>
              </div>
            ))}

          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <strong>Stock looks good</strong>
            <p>No products currently require restocking.</p>
          </div>
        )}

      </div>

    </div>
  )
}

export default AdminDashboard