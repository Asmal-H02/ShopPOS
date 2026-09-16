import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Layout() {
  const { user, logout } = useAuth()

  const navLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'active' : ''}`

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>

          <div>
            <h1>Sirisara</h1>
            <span>STORES</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-label">MAIN MENU</p>

          <nav className="sidebar-nav">
            {user?.role === 'admin' && (
              <>
                <NavLink to="/admin" className={navLinkClass}>
                  <span className="nav-icon">⌂</span>
                  Dashboard
                </NavLink>

                <NavLink to="/products" className={navLinkClass}>
                  <span className="nav-icon">▦</span>
                  Products
                </NavLink>

                <NavLink to="/categories" className={navLinkClass}>
                  <span className="nav-icon">◫</span>
                  Categories
                </NavLink>

                <NavLink to="/stock" className={navLinkClass}>
                  <span className="nav-icon">▤</span>
                  Stock
                </NavLink>

                <NavLink to="/sales" className={navLinkClass}>
                  <span className="nav-icon">↗</span>
                  Sales
                </NavLink>

                <NavLink to="/reports" className={navLinkClass}>
                  <span className="nav-icon">▥</span>
                  Reports
                </NavLink>

                <NavLink to="/customers" className={navLinkClass}>
                <span className="nav-icon">♙</span>
                Customers
                </NavLink>
              </>
            )}

            {user?.role === 'cashier' && (
              <>
                <NavLink to="/cashier" className={navLinkClass}>
                  <span className="nav-icon">⌂</span>
                  Dashboard
                </NavLink>

                <NavLink to="/pos" className={navLinkClass}>
                  <span className="nav-icon">▣</span>
                  POS
                </NavLink>

                <NavLink to="/products" className={navLinkClass}>
                  <span className="nav-icon">▦</span>
                  Products
                </NavLink>
                
                <NavLink to="/stock" className={navLinkClass}>
                    <span className="nav-icon">▤</span>
                    Stock
                </NavLink>

                <NavLink to="/categories" className={navLinkClass}>
                 <span className="nav-icon">◫</span>
                 Categories
                </NavLink>

                <NavLink to="/customers" className={navLinkClass}>
                <span className="nav-icon">♙</span>
                Customers
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="store-status">
            <span className="status-dot"></span>

            <div>
              <strong>System Online</strong>
              <small>ShopPOS is running</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <p className="topbar-label">POINT OF SALE</p>
            <h2>
              {user?.role === 'admin' ? 'Admin Panel' : 'Cashier Panel'}
            </h2>
          </div>

          <div className="user-area">
            <div className="user-info">
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{user?.username}</strong>
                <span>{user?.role}</span>
              </div>
            </div>

            <button className="logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout