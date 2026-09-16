import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

function POS() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [cart, setCart] = useState([])

  // Weight Product State
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [selectedWeightProduct, setSelectedWeightProduct] = useState(null)
  const [weight, setWeight] = useState('')

  // Liquid Product State
  const [showLiquidModal, setShowLiquidModal] = useState(false)
  const [selectedLiquidProduct, setSelectedLiquidProduct] = useState(null)
  const [liquidOptions, setLiquidOptions] = useState([])
  const [loadingLiquidOptions, setLoadingLiquidOptions] = useState(false)
  const [selectedLiquidOption, setSelectedLiquidOption] = useState(null)
  const [liquidQuantity, setLiquidQuantity] = useState('1')

  // Checkout State
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')

  // Customer / Credit State
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerOutstanding, setCustomerOutstanding] = useState(0)
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Sale Processing State
  const [processingSale, setProcessingSale] = useState(false)
  const [completedSale, setCompletedSale] = useState(null)

  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/products/')
      setProducts(response.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Unable to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase().trim()
    if (!value) return products

    return products.filter((product) => {
      const productName = product.name?.toLowerCase() || ''
      const barcode = product.barcode?.toLowerCase() || ''
      return productName.includes(value) || barcode.includes(value)
    })
  }, [products, search])

  // ==========================================================
  // UNIT PRODUCTS
  // ==========================================================

  const addUnitToCart = (product) => {
    setError('')
    if (product.stock <= 0) {
      setError(`${product.name} is out of stock.`)
      return
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id && item.product_type === 'unit'
      )

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          setError(`Only ${Math.round(product.stock)} unit(s) of ${product.name} are available.`)
          return currentCart
        }

        return currentCart.map((item) =>
          item.id === product.id && item.product_type === 'unit'
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...currentCart, { ...product, quantity: 1 }]
    })
  }

  // ==========================================================
  // WEIGHT PRODUCTS
  // ==========================================================

  const openWeightModal = (product) => {
    setError('')
    setSelectedWeightProduct(product)
    setWeight('')
    setShowWeightModal(true)
  }

  const closeWeightModal = () => {
    setShowWeightModal(false)
    setSelectedWeightProduct(null)
    setWeight('')
  }

  const addWeightToCart = () => {
    if (!selectedWeightProduct) return
    const enteredWeight = Number(weight)

    if (!Number.isFinite(enteredWeight) || enteredWeight <= 0) {
      setError('Please enter a valid weight.')
      return
    }

    if (enteredWeight > selectedWeightProduct.stock) {
      setError(`Only ${Number(selectedWeightProduct.stock).toFixed(3)} kg of ${selectedWeightProduct.name} is available.`)
      return
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === selectedWeightProduct.id && item.product_type === 'weight'
      )

      if (existingItem) {
        const newQuantity = existingItem.quantity + enteredWeight

        if (newQuantity > selectedWeightProduct.stock) {
          setError(`Only ${Number(selectedWeightProduct.stock).toFixed(3)} kg of ${selectedWeightProduct.name} is available.`)
          return currentCart
        }

        return currentCart.map((item) =>
          item.id === selectedWeightProduct.id && item.product_type === 'weight'
            ? { ...item, quantity: newQuantity }
            : item
        )
      }

      return [...currentCart, { ...selectedWeightProduct, quantity: enteredWeight }]
    })

    closeWeightModal()
  }

  // ==========================================================
  // LIQUID PRODUCTS
  // ==========================================================

  const loadLiquidOptions = async (productId) => {
    try {
      setLoadingLiquidOptions(true)
      setLiquidOptions([])
      const response = await api.get(`/liquid-options/product/${productId}`)
      setLiquidOptions(response.data.filter((option) => option.active))
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Unable to load liquid package options.')
      setLiquidOptions([])
    } finally {
      setLoadingLiquidOptions(false)
    }
  }

  const getLiquidCartVolume = (productId, excludeOptionId = null) => {
    return cart
      .filter(
        (item) =>
          item.id === productId &&
          item.product_type === 'liquid' &&
          item.liquid_option_id !== excludeOptionId
      )
      .reduce((total, item) => total + (Number(item.volume_ml) / 1000) * Number(item.quantity), 0)
  }

  const getLiquidOptionAvailablePackages = (product, option) => {
    const alreadyInCartLitres = getLiquidCartVolume(product.id, option.id)
    const remainingLitres = Number(product.stock || 0) - alreadyInCartLitres
    const packageLitres = Number(option.volume_ml) / 1000

    if (packageLitres <= 0) return 0
    return Math.floor((remainingLitres + 0.0000001) / packageLitres)
  }

  const openLiquidModal = async (product) => {
    setError('')
    setSelectedLiquidProduct(product)
    setSelectedLiquidOption(null)
    setLiquidQuantity('1')
    setShowLiquidModal(true)
    await loadLiquidOptions(product.id)
  }

  const closeLiquidModal = () => {
    setShowLiquidModal(false)
    setSelectedLiquidProduct(null)
    setLiquidOptions([])
    setSelectedLiquidOption(null)
    setLiquidQuantity('1')
  }

  const addLiquidToCart = () => {
    if (!selectedLiquidProduct || !selectedLiquidOption) {
      setError('Please select a package size.')
      return
    }

    const packageQuantity = Number(liquidQuantity)

    if (!Number.isInteger(packageQuantity) || packageQuantity <= 0) {
      setError('Package quantity must be a whole number.')
      return
    }

    const availablePackages = getLiquidOptionAvailablePackages(
      selectedLiquidProduct,
      selectedLiquidOption
    )

    if (packageQuantity > availablePackages) {
      setError(`Only ${availablePackages} package(s) of ${selectedLiquidOption.volume_ml}ml can be added with the current stock.`)
      return
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) =>
          item.id === selectedLiquidProduct.id &&
          item.product_type === 'liquid' &&
          item.liquid_option_id === selectedLiquidOption.id
      )

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === selectedLiquidProduct.id &&
          item.product_type === 'liquid' &&
          item.liquid_option_id === selectedLiquidOption.id
            ? { ...item, quantity: item.quantity + packageQuantity }
            : item
        )
      }

      return [
        ...currentCart,
        {
          ...selectedLiquidProduct,
          quantity: packageQuantity,
          liquid_option_id: selectedLiquidOption.id,
          volume_ml: selectedLiquidOption.volume_ml,
          liquid_selling_price: Number(selectedLiquidOption.selling_price),
          price: Number(selectedLiquidOption.selling_price),
        },
      ]
    })

    closeLiquidModal()
  }

  // ==========================================================
  // ADD PRODUCT TO CART
  // ==========================================================

  const addToCart = (product) => {
    if (product.product_type === 'weight') {
      openWeightModal(product)
      return
    }

    if (product.product_type === 'liquid') {
      openLiquidModal(product)
      return
    }

    addUnitToCart(product)
  }

  // ==========================================================
  // CART QUANTITY
  // ==========================================================

  const updateQuantity = (productId, newQuantity, liquidOptionId = null) => {
    const product = products.find((item) => item.id === productId)
    if (!product) return

    if (newQuantity <= 0) {
      removeFromCart(productId, liquidOptionId)
      return
    }

    // Liquid
    if (product.product_type === 'liquid' && liquidOptionId) {
      const cartItem = cart.find(
        (item) =>
          item.id === productId &&
          item.product_type === 'liquid' &&
          item.liquid_option_id === liquidOptionId
      )

      if (!cartItem) return

      const volumeLitres = (Number(cartItem.volume_ml) / 1000) * newQuantity
      const otherCartVolume = getLiquidCartVolume(productId, liquidOptionId)

      if (otherCartVolume + volumeLitres > Number(product.stock || 0) + 0.0000001) {
        setError(`Not enough ${product.name} stock for that quantity.`)
        return
      }

      setError('')
      setCart((currentCart) =>
        currentCart.map((item) =>
          item.id === productId &&
          item.product_type === 'liquid' &&
          item.liquid_option_id === liquidOptionId
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
      return
    }

    // Weight / Unit
    if (newQuantity > product.stock) {
      setError(
        product.product_type === 'weight'
          ? `Only ${Number(product.stock).toFixed(3)} kg of ${product.name} are available.`
          : `Only ${Math.round(product.stock)} unit(s) of ${product.name} are available.`
      )
      return
    }

    setError('')
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId && item.product_type !== 'liquid'
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  // ==========================================================
  // REMOVE & CLEAR CART
  // ==========================================================

  const removeFromCart = (productId, liquidOptionId = null) => {
    setCart((currentCart) =>
      currentCart.filter((item) => {
        if (item.id !== productId) return true
        if (item.product_type !== 'liquid') return false
        return item.liquid_option_id !== liquidOptionId
      })
    )
    setError('')
  }

  const clearCart = () => {
    setCart([])
    setError('')
  }

  // ==========================================================
  // TOTALS
  // ==========================================================

  const totalItems = cart.reduce((total, item) => total + Number(item.quantity || 0), 0)

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      Number(
        item.product_type === 'liquid' ? item.liquid_selling_price : item.price
      ) * Number(item.quantity),
    0
  )

  const total = subtotal
  const numericAmountPaid = Number(amountPaid) || 0
  const change = numericAmountPaid >= total ? numericAmountPaid - total : 0

  // ==========================================================
  // CHECKOUT
  // ==========================================================

  const openCheckout = () => {
    setError('')
    if (cart.length === 0) {
      setError('Add at least one product before checkout.')
      return
    }

    setPaymentMethod('cash')
    setAmountPaid('')
    setCustomerSearch('')
    setCustomers([])
    setSelectedCustomer(null)
    setCustomerOutstanding(0)
    setShowCheckout(true)
  }

  const searchCustomers = async (value) => {
    setCustomerSearch(value)
    setSelectedCustomer(null)
    setCustomerOutstanding(0)

    if (!value.trim()) {
      setCustomers([])
      return
    }

    try {
      setLoadingCustomers(true)
      const response = await api.get('/customers/', { params: { search: value } })
      setCustomers(response.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Unable to search customers.')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const selectCustomer = async (customer) => {
    try {
      setError('')
      setSelectedCustomer(customer)
      setCustomerSearch(customer.name)
      setCustomers([])

      const response = await api.get(`/customers/${customer.id}/credit`)
      setCustomerOutstanding(Number(response.data.outstanding) || 0)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Unable to load customer credit information.')
      setSelectedCustomer(null)
      setCustomerOutstanding(0)
    }
  }

  const closeCheckout = () => {
    if (processingSale) return
    setShowCheckout(false)
    setAmountPaid('')
    setPaymentMethod('cash')
    setCustomerSearch('')
    setCustomers([])
    setSelectedCustomer(null)
    setCustomerOutstanding(0)
  }

  const completeSale = async () => {
    if (paymentMethod === 'credit' && !selectedCustomer) {
      setError('Please select a customer for a credit sale.')
      return
    }

    const paid = Number(amountPaid)

    if (paymentMethod === 'cash') {
      if (!paid || paid <= 0) {
        setError('Please enter the amount received.')
        return
      }

      if (paid < total) {
        setError(`Amount received is less than the total of Rs. ${total.toFixed(2)}.`)
        return
      }
    }

    try {
      setProcessingSale(true)
      setError('')

      const saleData = {
        items: cart.map((item) => {
          const saleItem = { product_id: item.id, quantity: item.quantity }
          if (item.product_type === 'liquid') {
            saleItem.liquid_option_id = item.liquid_option_id
          }
          return saleItem
        }),
        amount_paid: paymentMethod === 'credit' ? 0 : paid,
        payment_method: paymentMethod,
        customer_id: paymentMethod === 'credit' ? selectedCustomer.id : null,
      }

      const response = await api.post('/sales/', saleData)

      setCompletedSale(response.data)
      setShowCheckout(false)
      setCart([])
      setAmountPaid('')
      setPaymentMethod('cash')
      setCustomerSearch('')
      setCustomers([])
      setSelectedCustomer(null)
      setCustomerOutstanding(0)

      await loadProducts()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Unable to complete the sale. Please try again.')
    } finally {
      setProcessingSale(false)
    }
  }

  // ==========================================================
  // RECEIPT MANAGEMENT
  // ==========================================================

  const viewReceipt = async () => {
    if (!completedSale?.sale_id) return

    try {
      const response = await api.get(`/sales/${completedSale.sale_id}/receipt`, { responseType: 'text' })
      const receiptWindow = window.open('', '_blank', 'width=420,height=700')

      if (!receiptWindow) {
        setError('Please allow pop-ups to view the receipt.')
        return
      }

      receiptWindow.document.write(`
        <html>
          <head>
            <title>Receipt #${String(completedSale.sale_id).padStart(6, '0')}</title>
            <style>
              body { margin: 0; padding: 24px; background: #ffffff; color: #111827; font-family: "Courier New", monospace; }
              pre { margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.5; }
            </style>
          </head>
          <body><pre>${response.data}</pre></body>
        </html>
      `)
      receiptWindow.document.close()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Unable to load the receipt.')
    }
  }

  const printReceipt = async () => {
    if (!completedSale?.sale_id) return

    try {
      const response = await api.get(`/sales/${completedSale.sale_id}/receipt`, { responseType: 'text' })
      const printWindow = window.open('', '_blank', 'width=420,height=700')

      if (!printWindow) {
        setError('Please allow pop-ups to print the receipt.')
        return
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt #${String(completedSale.sale_id).padStart(6, '0')}</title>
            <style>
              @page { margin: 10mm; }
              body { margin: 0; padding: 10px; background: #ffffff; color: #111827; font-family: "Courier New", monospace; }
              pre { margin: 0; white-space: pre-wrap; font-size: 12px; line-height: 1.4; }
            </style>
          </head>
          <body><pre>${response.data}</pre></body>
        </html>
      `)
      printWindow.document.close()

      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Unable to print the receipt.')
    }
  }

  const startNewSale = () => {
    setCompletedSale(null)
    setError('')
    setSearch('')
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="pos-page">
      <div className="pos-heading">
        <div>
          <p className="page-eyebrow">POINT OF SALE</p>
          <h1>New Sale</h1>
          <p>Search products and add them to the current sale.</p>
        </div>

        <div className="pos-item-count">
          <span>Items</span>
          <strong>{totalItems}</strong>
        </div>
      </div>

      {error && <div className="pos-error">{error}</div>}

      {/* SALE COMPLETED */}
      {completedSale && (
        <div className="sale-success-card">
          <div className="sale-success-icon">✓</div>
          <div className="sale-success-content">
            <p className="page-eyebrow">SALE COMPLETED</p>
            <h2>Sale #{String(completedSale.sale_id).padStart(6, '0')}</h2>
            <p>The sale was successfully recorded and stock has been updated.</p>

            <div className="sale-success-details">
              <div>
                <span>Total</span>
                <strong>Rs. {Number(completedSale.total_amount).toFixed(2)}</strong>
              </div>
              <div>
                <span>Cash Received</span>
                <strong>Rs. {Number(completedSale.amount_paid).toFixed(2)}</strong>
              </div>
              <div>
                <span>Change</span>
                <strong>Rs. {Number(completedSale.change).toFixed(2)}</strong>
              </div>
            </div>

            <div className="sale-success-actions">
              <button className="receipt-button secondary" onClick={viewReceipt}>
                View Receipt
              </button>
              <button className="receipt-button primary" onClick={printReceipt}>
                Print Receipt
              </button>
              <button className="new-sale-button" onClick={startNewSale}>
                Start New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN POS LAYOUT */}
      <div className="pos-layout">
        {/* PRODUCTS SECTION */}
        <section className="pos-products-card">
          <div className="pos-card-header">
            <div>
              <h2>Products</h2>
              <span>{products.length} products available</span>
            </div>
          </div>

          <div className="pos-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search by product name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {loading ? (
            <div className="pos-state">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="pos-empty">
              <div className="pos-empty-icon">⌕</div>
              <h3>No products found</h3>
              <p>Try searching with another product name or barcode.</p>
            </div>
          ) : (
            <div className="pos-product-grid">
              {filteredProducts.map((product) => {
                const productCartItems = cart.filter((item) => item.id === product.id)
                let availableStock = Number(product.stock)

                if (product.product_type === 'liquid') {
                  const cartVolume = productCartItems.reduce(
                    (total, item) => total + (Number(item.volume_ml) / 1000) * Number(item.quantity),
                    0
                  )
                  availableStock -= cartVolume
                } else {
                  const cartQuantity = productCartItems.reduce(
                    (total, item) => total + Number(item.quantity || 0),
                    0
                  )
                  availableStock -= cartQuantity
                }

                const outOfStock = Number(product.stock) <= 0

                return (
                  <button
                    key={product.id}
                    className={`pos-product ${outOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                  >
                    <div className="pos-product-icon">▦</div>
                    <div className="pos-product-info">
                      <strong>{product.name}</strong>
                      <span>{product.barcode || 'No barcode'}</span>
                    </div>

                    <div className="pos-product-bottom">
                      <strong>
                        {product.product_type === 'liquid'
                          ? 'Select size'
                          : `Rs. ${Number(product.price).toFixed(2)}`}
                        {product.product_type === 'weight' && <small> / kg</small>}
                      </strong>

                      <span className={availableStock <= product.reorder_level ? 'low' : ''}>
                        {outOfStock
                          ? 'Out of stock'
                          : product.product_type === 'weight'
                          ? `${availableStock.toFixed(3)} kg available`
                          : product.product_type === 'liquid'
                          ? `${availableStock.toFixed(3)} L available`
                          : `${Math.round(availableStock)} available`}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* CART SECTION */}
        <section className="pos-cart-card">
          <div className="pos-card-header">
            <div>
              <h2>Current Sale</h2>
              <span>{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</span>
            </div>

            {cart.length > 0 && (
              <button className="clear-cart-button" onClick={clearCart}>
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="pos-empty">
              <div className="pos-empty-icon">🛒</div>
              <h3>Cart is empty</h3>
              <p>Click on products from the list to add them to the current sale.</p>
            </div>
          ) : (
            <div className="pos-cart-content">
              <div className="pos-cart-items">
                {cart.map((item, index) => {
                  const itemPrice =
                    item.product_type === 'liquid'
                      ? item.liquid_selling_price
                      : item.price
                  const itemTotal = itemPrice * item.quantity

                  return (
                    <div key={`${item.id}-${item.liquid_option_id || index}`} className="pos-cart-item">
                      <div className="pos-cart-item-info">
                        <strong>{item.name}</strong>
                        <span>
                          {item.product_type === 'liquid' ? (
                            <>Rs. {Number(itemPrice).toFixed(2)} ({item.volume_ml}ml)</>
                          ) : item.product_type === 'weight' ? (
                            <>Rs. {Number(itemPrice).toFixed(2)} / kg</>
                          ) : (
                            <>Rs. {Number(itemPrice).toFixed(2)}</>
                          )}
                        </span>
                      </div>

                      <div className="pos-cart-item-actions">
                        <div className="quantity-controls">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.product_type === 'weight'
                                  ? Number((item.quantity - 0.1).toFixed(3))
                                  : item.quantity - 1,
                                item.liquid_option_id
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {item.product_type === 'weight'
                              ? `${Number(item.quantity).toFixed(3)} kg`
                              : item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.product_type === 'weight'
                                  ? Number((item.quantity + 0.1).toFixed(3))
                                  : item.quantity + 1,
                                item.liquid_option_id
                              )
                            }
                          >
                            +
                          </button>
                        </div>

                        <strong className="pos-cart-item-total">
                          Rs. {Number(itemTotal).toFixed(2)}
                        </strong>

                        <button
                          className="remove-item-button"
                          onClick={() => removeFromCart(item.id, item.liquid_option_id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pos-cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>Rs. {Number(subtotal).toFixed(2)}</strong>
                </div>

                <div className="summary-row total">
                  <span>Total</span>
                  <strong>Rs. {Number(total).toFixed(2)}</strong>
                </div>

                <button className="checkout-button" onClick={openCheckout}>
                  Pay Rs. {Number(total).toFixed(2)}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* WEIGHT MODAL */}
      {showWeightModal && selectedWeightProduct && (
        <div className="pos-modal-overlay" onClick={closeWeightModal}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-header">
              <h3>Enter Weight</h3>
              <button className="pos-modal-close" onClick={closeWeightModal}>×</button>
            </div>

            <div className="pos-modal-body">
              <p><strong>{selectedWeightProduct.name}</strong></p>
              <p>Price: Rs. {Number(selectedWeightProduct.price).toFixed(2)} / kg</p>
              <p>Available: {Number(selectedWeightProduct.stock).toFixed(3)} kg</p>

              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="pos-modal-footer">
              <button className="secondary" onClick={closeWeightModal}>Cancel</button>
              <button className="primary" onClick={addWeightToCart}>Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {/* LIQUID MODAL */}
      {showLiquidModal && selectedLiquidProduct && (
        <div className="pos-modal-overlay" onClick={closeLiquidModal}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-header">
              <h3>Select Package Size</h3>
              <button className="pos-modal-close" onClick={closeLiquidModal}>×</button>
            </div>

            <div className="pos-modal-body">
              <p><strong>{selectedLiquidProduct.name}</strong></p>
              <p>Stock: {Number(selectedLiquidProduct.stock).toFixed(3)} L available</p>

              {loadingLiquidOptions ? (
                <p>Loading package options...</p>
              ) : liquidOptions.length === 0 ? (
                <p>No package options configured for this product.</p>
              ) : (
                <>
                  <div className="liquid-options-list">
                    {liquidOptions.map((option) => {
                      const availablePackages = getLiquidOptionAvailablePackages(
                        selectedLiquidProduct,
                        option
                      )
                      const isSelected = selectedLiquidOption?.id === option.id

                      return (
                        <div
                          key={option.id}
                          className={`liquid-option-card ${isSelected ? 'selected' : ''} ${availablePackages <= 0 ? 'disabled' : ''}`}
                          onClick={() => {
                            if (availablePackages > 0) setSelectedLiquidOption(option)
                          }}
                        >
                          <div>
                            <strong>{option.volume_ml} ml</strong>
                            <span>Rs. {Number(option.selling_price).toFixed(2)}</span>
                          </div>
                          <small>
                            {availablePackages > 0 ? `${availablePackages} available` : 'Out of stock'}
                          </small>
                        </div>
                      )
                    })}
                  </div>

                  {selectedLiquidOption && (
                    <div className="form-group" style={{ marginTop: '16px' }}>
                      <label>Quantity of Packages</label>
                      <input
                        type="number"
                        min="1"
                        value={liquidQuantity}
                        onChange={(e) => setLiquidQuantity(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pos-modal-footer">
              <button className="secondary" onClick={closeLiquidModal}>Cancel</button>
              <button className="primary" onClick={addLiquidToCart} disabled={!selectedLiquidOption}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="pos-modal-overlay" onClick={closeCheckout}>
          <div className="pos-modal checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-header">
              <h3>Checkout</h3>
              <button className="pos-modal-close" onClick={closeCheckout} disabled={processingSale}>×</button>
            </div>

            <div className="pos-modal-body">
              <div className="checkout-summary">
                <span>Total Amount Due</span>
                <h2>Rs. {Number(total).toFixed(2)}</h2>
              </div>

              <div className="payment-method-selector">
                <button
                  className={paymentMethod === 'cash' ? 'active' : ''}
                  onClick={() => setPaymentMethod('cash')}
                  type="button"
                >
                  Cash
                </button>
                <button
                  className={paymentMethod === 'credit' ? 'active' : ''}
                  onClick={() => setPaymentMethod('credit')}
                  type="button"
                >
                  Credit Customer
                </button>
              </div>

              {paymentMethod === 'cash' ? (
                <div className="form-group">
                  <label>Amount Received</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    autoFocus
                  />
                  {numericAmountPaid > 0 && (
                    <div className="change-preview">
                      <span>Change:</span>
                      <strong>Rs. {Number(change).toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="credit-customer-section">
                  <div className="form-group">
                    <label>Search Customer</label>
                    <input
                      type="text"
                      placeholder="Type customer name or phone..."
                      value={customerSearch}
                      onChange={(e) => searchCustomers(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {loadingCustomers && <p>Searching customers...</p>}

                  {customers.length > 0 && (
                    <div className="customer-results">
                      {customers.map((customer) => (
                        <div
                          key={customer.id}
                          className="customer-result-item"
                          onClick={() => selectCustomer(customer)}
                        >
                          <strong>{customer.name}</strong>
                          <span>{customer.phone || 'No phone'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedCustomer && (
                    <div className="selected-customer-card">
                      <div className="customer-info">
                        <strong>Selected: {selectedCustomer.name}</strong>
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      <div className="customer-credit-info">
                        <span>Outstanding Balance:</span>
                        <strong>Rs. {Number(customerOutstanding).toFixed(2)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pos-modal-footer">
              <button className="secondary" onClick={closeCheckout} disabled={processingSale}>
                Cancel
              </button>
              <button
                className="primary"
                onClick={completeSale}
                disabled={
                  processingSale ||
                  (paymentMethod === 'cash' && numericAmountPaid < total) ||
                  (paymentMethod === 'credit' && !selectedCustomer)
                }
              >
                {processingSale ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default POS