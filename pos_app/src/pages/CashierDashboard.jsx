import { useNavigate } from 'react-router-dom'

function CashierDashboard() {
  const navigate = useNavigate()

  return (
    <div className="cashier-dashboard">

      <div className="cashier-dashboard-heading">
        <div>
          <p className="page-eyebrow">POINT OF SALE</p>
          <h1>Cashier Dashboard</h1>
          <p>
            Welcome back. Everything you need for daily checkout is ready.
          </p>
        </div>
      </div>

      <section className="cashier-welcome-card">
        <div className="cashier-welcome-content">
          <div className="cashier-welcome-icon">
            S
          </div>

          <div>
            <p className="page-eyebrow">SHOPPOS</p>
            <h2>Ready for checkout</h2>
            <p>
              Start a new sale or manage products, stock and categories.
            </p>
          </div>
        </div>

        <button
          className="cashier-primary-button"
          onClick={() => navigate('/pos')}
        >
          Start New Sale
        </button>
      </section>

      <section className="cashier-section">
        <div className="cashier-section-heading">
          <div>
            <p className="page-eyebrow">QUICK ACCESS</p>
            <h2>Daily Operations</h2>
          </div>
        </div>

        <div className="cashier-action-grid">

          <button
            className="cashier-action-card"
            onClick={() => navigate('/pos')}
          >
            <div className="cashier-action-icon blue">
              ▣
            </div>

            <div>
              <h3>Point of Sale</h3>
              <p>
                Create a new customer sale and complete checkout.
              </p>
            </div>

            <span className="cashier-action-arrow">
              →
            </span>
          </button>

          <button
            className="cashier-action-card"
            onClick={() => navigate('/products')}
          >
            <div className="cashier-action-icon cyan">
              ▦
            </div>

            <div>
              <h3>Products</h3>
              <p>
                Search products, prices and available stock.
              </p>
            </div>

            <span className="cashier-action-arrow">
              →
            </span>
          </button>

          <button
            className="cashier-action-card"
            onClick={() => navigate('/stock')}
          >
            <div className="cashier-action-icon green">
              ▤
            </div>

            <div>
              <h3>Stock</h3>
              <p>
                Check current inventory and stock availability.
              </p>
            </div>

            <span className="cashier-action-arrow">
              →
            </span>
          </button>

          <button
            className="cashier-action-card"
            onClick={() => navigate('/categories')}
          >
            <div className="cashier-action-icon purple">
              ◫
            </div>

            <div>
              <h3>Categories</h3>
              <p>
                Browse products by their assigned categories.
              </p>
            </div>

            <span className="cashier-action-arrow">
              →
            </span>
          </button>

        </div>
      </section>

    </div>
  )
}

export default CashierDashboard

