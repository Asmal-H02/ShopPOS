import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Customers() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')

  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [creditData, setCreditData] = useState(null)

  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingCredit, setLoadingCredit] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  const [paymentAmount, setPaymentAmount] = useState('')

  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerAddress, setNewCustomerAddress] = useState('')
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ============================================================
  // LOAD CUSTOMERS
  // ============================================================

  const loadCustomers = async (searchValue = '') => {
    try {
      setLoadingCustomers(true)
      setError('')

      const response = await api.get('/customers/', {
        params: searchValue.trim()
          ? { search: searchValue }
          : {},
      })

      setCustomers(response.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to load customers.'
      )
    } finally {
      setLoadingCustomers(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = (value) => {
    setSearch(value)
    loadCustomers(value)
  }

  // ============================================================
  // SELECT CUSTOMER
  // ============================================================

  const selectCustomer = async (customer) => {
    try {
      setSelectedCustomer(customer)
      setCreditData(null)
      setPaymentAmount('')
      setError('')
      setSuccess('')
      setLoadingCredit(true)

      const response = await api.get(
        `/customers/${customer.id}/credit`
      )

      setCreditData(response.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to load customer credit information.'
      )
    } finally {
      setLoadingCredit(false)
    }
  }

  // ============================================================
  // RECORD PAYMENT
  // ============================================================

  const recordPayment = async () => {
    if (!selectedCustomer || !creditData) {
      return
    }

    const amount = Number(paymentAmount)

    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount.')
      return
    }

    if (amount > creditData.outstanding) {
      setError(
        `Payment cannot exceed the outstanding balance of Rs. ${Number(
          creditData.outstanding
        ).toFixed(2)}.`
      )
      return
    }

    try {
      setProcessingPayment(true)
      setError('')
      setSuccess('')

      const response = await api.post(
        `/customers/${selectedCustomer.id}/payment`,
        null,
        {
          params: {
            amount,
          },
        }
      )

      setSuccess(
        `Payment of Rs. ${amount.toFixed(
          2
        )} recorded successfully.`
      )

      setPaymentAmount('')

      // Reload credit information
      const creditResponse = await api.get(
        `/customers/${selectedCustomer.id}/credit`
      )

      setCreditData(creditResponse.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to record payment.'
      )
    } finally {
      setProcessingPayment(false)
    }
  }

  // ============================================================
  // CREATE CUSTOMER - ADMIN ONLY
  // ============================================================

  const createCustomer = async () => {
    const name = newCustomerName.trim()

    if (!name) {
      setError('Customer name is required.')
      return
    }

    try {
      setCreatingCustomer(true)
      setError('')
      setSuccess('')

      const response = await api.post('/customers/', null, {
        params: {
          name,
          phone: newCustomerPhone.trim() || null,
          address: newCustomerAddress.trim() || null,
        },
      })

      setSuccess(
        `Customer "${response.data.name}" created successfully.`
      )

      setNewCustomerName('')
      setNewCustomerPhone('')
      setNewCustomerAddress('')
      setShowCreateCustomer(false)

      await loadCustomers(search)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          'Unable to create customer.'
      )
    } finally {
      setCreatingCustomer(false)
    }
  }

  // ============================================================
  // CLEAR SELECTED CUSTOMER
  // ============================================================

  const clearSelectedCustomer = () => {
    setSelectedCustomer(null)
    setCreditData(null)
    setPaymentAmount('')
    setError('')
    setSuccess('')
  }

  return (
    <div className="customers-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-header">
        <div>
          <p className="page-eyebrow">CUSTOMER MANAGEMENT</p>

          <h1>Customers & Credit</h1>

          <p>
            Manage customer accounts, credit balances and payments.
          </p>
        </div>

        {isAdmin && (
          <button
            className="primary-button"
            onClick={() => {
              setShowCreateCustomer(true)
              setError('')
              setSuccess('')
            }}
          >
            + Add Customer
          </button>
        )}
      </div>

      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {error && (
        <div className="page-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="page-message success">
          {success}
        </div>
      )}

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="customers-layout">

        {/* ====================================================
            CUSTOMER LIST
        ==================================================== */}

        <section className="customers-list-card">

          <div className="card-header">
            <div>
              <p className="page-eyebrow">CUSTOMERS</p>
              <h2>Customer Accounts</h2>
            </div>

            <span className="customer-count">
              {customers.length}
            </span>
          </div>

          <div className="customer-search">
            <input
              type="text"
              placeholder="Search customer by name..."
              value={search}
              onChange={(e) =>
                handleSearch(e.target.value)
              }
            />
          </div>

          <div className="customer-list">

            {loadingCustomers ? (
              <div className="empty-state">
                Loading customers...
              </div>
            ) : customers.length === 0 ? (
              <div className="empty-state">
                No customers found.
              </div>
            ) : (
              customers.map((customer) => (
                <button
                  key={customer.id}
                  className={`customer-list-item ${
                    selectedCustomer?.id === customer.id
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() =>
                    selectCustomer(customer)
                  }
                >
                  <div className="customer-avatar">
                    {customer.name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="customer-list-info">
                    <strong>
                      {customer.name}
                    </strong>

                    <span>
                      {customer.phone ||
                        'No phone number'}
                    </span>
                  </div>

                  <span className="customer-arrow">
                    →
                  </span>
                </button>
              ))
            )}

          </div>

        </section>

        {/* ====================================================
            CUSTOMER DETAILS
        ==================================================== */}

        <section className="customer-details-card">

          {!selectedCustomer ? (
            <div className="customer-placeholder">

              <div className="customer-placeholder-icon">
                ♙
              </div>

              <h2>Select a Customer</h2>

              <p>
                Select a customer from the list to view
                their credit balance and transaction history.
              </p>

            </div>
          ) : (
            <>
              {/* CUSTOMER HEADER */}

              <div className="customer-details-header">

                <div className="customer-profile">

                  <div className="customer-large-avatar">
                    {selectedCustomer.name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="page-eyebrow">
                      CUSTOMER
                    </p>

                    <h2>
                      {selectedCustomer.name}
                    </h2>

                    {selectedCustomer.phone && (
                      <p>
                        {selectedCustomer.phone}
                      </p>
                    )}
                  </div>

                </div>

                <button
                  className="secondary-button"
                  onClick={clearSelectedCustomer}
                >
                  Clear
                </button>

              </div>

              {loadingCredit ? (
                <div className="empty-state">
                  Loading credit information...
                </div>
              ) : creditData ? (
                <>

                  {/* CREDIT SUMMARY */}

                  <div className="credit-summary">

                    <div className="credit-summary-card">
                      <span>Total Credit</span>

                      <strong>
                        Rs.{' '}
                        {Number(
                          creditData.total_credit
                        ).toFixed(2)}
                      </strong>
                    </div>

                    <div className="credit-summary-card">
                      <span>Total Paid</span>

                      <strong>
                        Rs.{' '}
                        {Number(
                          creditData.total_paid
                        ).toFixed(2)}
                      </strong>
                    </div>

                    <div className="credit-summary-card outstanding">
                      <span>Outstanding</span>

                      <strong>
                        Rs.{' '}
                        {Number(
                          creditData.outstanding
                        ).toFixed(2)}
                      </strong>
                    </div>

                  </div>

                  {/* PAYMENT */}

                  <div className="credit-payment-section">

                    <div>
                      <p className="page-eyebrow">
                        CREDIT PAYMENT
                      </p>

                      <h3>Record Payment</h3>

                      <p>
                        Accept a payment from this customer
                        and reduce their outstanding balance.
                      </p>
                    </div>

                    <div className="payment-form">

                      <div className="payment-input-wrapper">
                        <span>Rs.</span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={paymentAmount}
                          onChange={(e) =>
                            setPaymentAmount(
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <button
                        className="primary-button"
                        onClick={recordPayment}
                        disabled={
                          processingPayment ||
                          Number(
                            creditData.outstanding
                          ) <= 0
                        }
                      >
                        {processingPayment
                          ? 'Recording...'
                          : 'Record Payment'}
                      </button>

                    </div>

                  </div>

                  {/* TRANSACTION HISTORY */}

                  <div className="credit-history">

                    <div className="card-header">
                      <div>
                        <p className="page-eyebrow">
                          ACCOUNT ACTIVITY
                        </p>

                        <h3>
                          Credit History
                        </h3>
                      </div>
                    </div>

                    {creditData.transactions
                      ?.length === 0 ? (
                      <div className="empty-state">
                        No credit transactions yet.
                      </div>
                    ) : (
                      <div className="transaction-table">

                        <div className="transaction-row transaction-header">
                          <span>Date</span>
                          <span>Type</span>
                          <span>Sale</span>
                          <span>Amount</span>
                        </div>

                        {creditData.transactions.map(
                          (transaction) => (
                            <div
                              className="transaction-row"
                              key={transaction.id}
                            >
                              <span>
                                {new Date(
                                  transaction.created_at
                                ).toLocaleString()}
                              </span>

                              <span
                                className={`transaction-type ${
                                  transaction.transaction_type
                                }`}
                              >
                                {transaction.transaction_type ===
                                'credit'
                                  ? 'Credit'
                                  : 'Payment'}
                              </span>

                              <span>
                                {transaction.sale_id
                                  ? `#${String(
                                      transaction.sale_id
                                    ).padStart(6, '0')}`
                                  : '—'}
                              </span>

                              <strong>
                                Rs.{' '}
                                {Number(
                                  transaction.amount
                                ).toFixed(2)}
                              </strong>
                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                </>
              ) : null}

            </>
          )}

        </section>

      </div>

      {/* ======================================================
          CREATE CUSTOMER MODAL
      ====================================================== */}

      {showCreateCustomer && isAdmin && (
        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">

              <div>
                <p className="page-eyebrow">
                  CUSTOMER MANAGEMENT
                </p>

                <h2>Add Customer</h2>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowCreateCustomer(false)
                }
              >
                ×
              </button>

            </div>

            <div className="modal-body">

              <label>
                Customer Name
              </label>

              <input
                type="text"
                placeholder="Enter customer name"
                value={newCustomerName}
                onChange={(e) =>
                  setNewCustomerName(e.target.value)
                }
              />

              <label>
                Phone Number
              </label>

              <input
                type="text"
                placeholder="Enter phone number"
                value={newCustomerPhone}
                onChange={(e) =>
                  setNewCustomerPhone(e.target.value)
                }
              />

              <label>
                Address
              </label>

              <textarea
                placeholder="Enter address"
                value={newCustomerAddress}
                onChange={(e) =>
                  setNewCustomerAddress(e.target.value)
                }
                rows="3"
              />

            </div>

            <div className="modal-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  setShowCreateCustomer(false)
                }
                disabled={creatingCustomer}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={createCustomer}
                disabled={creatingCustomer}
              >
                {creatingCustomer
                  ? 'Creating...'
                  : 'Create Customer'}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default Customers