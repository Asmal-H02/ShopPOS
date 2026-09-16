import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import CashierDashboard from './pages/CashierDashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Stock from './pages/Stock'
import POS from './pages/POS'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import Customers from './pages/Customers'

import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'

function App() {
  const { user, isAuthenticated } = useAuth()

  const isAdminOrCashier =
    user?.role === 'admin' || user?.role === 'cashier'

  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            LOGIN
        ===================================================== */}

        <Route
          path="/"
          element={<Login />}
        />

        {/* =====================================================
            AUTHENTICATED APPLICATION
        ===================================================== */}

        <Route
          element={
            isAuthenticated ? (
              <Layout />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >

          {/* ================= ADMIN ================= */}

          <Route
            path="/admin"
            element={
              user?.role === 'admin' ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* ================= CASHIER ================= */}

          <Route
            path="/cashier"
            element={
              user?.role === 'cashier' ? (
                <CashierDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* ================= SHARED ================= */}

          <Route
            path="/products"
            element={
              isAdminOrCashier ? (
                <Products />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/categories"
            element={
              isAdminOrCashier ? (
                <Categories />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/stock"
            element={
              isAdminOrCashier ? (
                <Stock />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/pos"
            element={
              isAdminOrCashier ? (
                <POS />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/customers"
            element={
              isAdminOrCashier ? (
                <Customers />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* ================= ADMIN ONLY ================= */}

          <Route
            path="/sales"
            element={
              user?.role === 'admin' ? (
                <Sales />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/reports"
            element={
              user?.role === 'admin' ? (
                <Reports />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App