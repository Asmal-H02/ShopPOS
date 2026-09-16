import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Products() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const [form, setForm] = useState({
    name: '',
    barcode: '',
    product_type: 'unit',
    price: '',
    cost_price: '',
    stock: '',
    reorder_level: '',
    category_id: '',
  })

  const [saving, setSaving] = useState(false)

  const [liquidOptions, setLiquidOptions] = useState([])
  const [loadingLiquidOptions, setLoadingLiquidOptions] = useState(false)
  const [savingLiquidOption, setSavingLiquidOption] = useState(false)
  const [editingLiquidOptionId, setEditingLiquidOptionId] = useState(null)

  const [newLiquidOption, setNewLiquidOption] = useState({
    volume_ml: '',
    selling_price: '',
    barcode: '',
  })

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/products/')
      setProducts(response.data)
    } catch (error) {
      console.error(error)
      setError('Unable to load products.')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/')
      setCategories(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  const loadLiquidOptions = async (productId) => {
    if (!productId) {
      setLiquidOptions([])
      return
    }

    try {
      setLoadingLiquidOptions(true)

      const response = await api.get(
        `/liquid-options/product/${productId}`
      )

      setLiquidOptions(response.data)
    } catch (error) {
      console.error(error)
      setLiquidOptions([])
    } finally {
      setLoadingLiquidOptions(false)
    }
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) => item.id === categoryId
    )

    return category ? category.name : 'Uncategorized'
  }

  const filteredProducts = products.filter((product) => {
    const searchValue = search.toLowerCase().trim()

    if (!searchValue) {
      return true
    }

    const productName = product.name?.toLowerCase() || ''
    const barcode = product.barcode?.toLowerCase() || ''
    const categoryName =
      getCategoryName(product.category_id).toLowerCase()

    return (
      productName.includes(searchValue) ||
      barcode.includes(searchValue) ||
      categoryName.includes(searchValue)
    )
  })

  const openAddModal = () => {
    setEditingProduct(null)
    setEditingLiquidOptionId(null)

    setLiquidOptions([])

    setNewLiquidOption({
      volume_ml: '',
      selling_price: '',
      barcode: '',
    })

    setForm({
      name: '',
      barcode: '',
      product_type: 'unit',
      price: '',
      cost_price: '',
      stock: '',
      reorder_level: '',
      category_id: '',
    })

    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setEditingLiquidOptionId(null)

    setForm({
      name: product.name || '',
      barcode: product.barcode || '',
      product_type: product.product_type || 'unit',
      price: product.price ?? '',
      cost_price: product.cost_price ?? '',
      stock: product.stock ?? '',
      reorder_level: product.reorder_level ?? '',
      category_id: product.category_id ?? '',
    })

    if (product.product_type === 'liquid') {
      loadLiquidOptions(product.id)
    } else {
      setLiquidOptions([])
    }

    setNewLiquidOption({
      volume_ml: '',
      selling_price: '',
      barcode: '',
    })

    setShowModal(true)
  }

  const closeModal = () => {
  if (saving) return

  setShowModal(false)
  setSelectedProduct(null)
  setQuantity('')
  setCostPerKg('')
}

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleProductTypeChange = (event) => {
    const productType = event.target.value

    setForm((previous) => ({
      ...previous,
      product_type: productType,
    }))
  }

  const handleLiquidOptionChange = (event) => {
    const { name, value } = event.target

    setNewLiquidOption((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleAddLiquidOption = async () => {
    if (!editingProduct) {
      alert('Save the liquid product first.')
      return
    }

    if (!newLiquidOption.volume_ml) {
      alert('Package size is required.')
      return
    }

    if (Number(newLiquidOption.volume_ml) <= 0) {
      alert('Package size must be greater than zero.')
      return
    }

    if (
      !newLiquidOption.selling_price ||
      Number(newLiquidOption.selling_price) <= 0
    ) {
      alert('Selling price must be greater than zero.')
      return
    }

    try {
      setSavingLiquidOption(true)

      await api.post(
        `/liquid-options/product/${editingProduct.id}`,
        {
          volume_ml: Number(newLiquidOption.volume_ml),
          selling_price: Number(
            newLiquidOption.selling_price
          ),
          barcode: newLiquidOption.barcode.trim()
            ? newLiquidOption.barcode.trim()
            : null,
        }
      )

      setNewLiquidOption({
        volume_ml: '',
        selling_price: '',
        barcode: '',
      })

      await loadLiquidOptions(editingProduct.id)
    } catch (error) {
      console.error(error)

      const message =
        error.response?.data?.detail ||
        'Unable to add package price.'

      alert(message)
    } finally {
      setSavingLiquidOption(false)
    }
  }

  const handleExistingLiquidOptionChange = (
    optionId,
    field,
    value
  ) => {
    setLiquidOptions((previous) =>
      previous.map((option) =>
        option.id === optionId
          ? {
              ...option,
              [field]: value,
            }
          : option
      )
    )
  }

  const handleUpdateLiquidOption = async (optionId) => {
    const option = liquidOptions.find(
      (item) => item.id === optionId
    )

    if (!option) {
      return
    }

    if (Number(option.volume_ml) <= 0) {
      alert('Package size must be greater than zero.')
      return
    }

    if (Number(option.selling_price) <= 0) {
      alert('Selling price must be greater than zero.')
      return
    }

    try {
      setSavingLiquidOption(true)

      await api.put(`/liquid-options/${optionId}`, {
        volume_ml: Number(option.volume_ml),
        selling_price: Number(
          option.selling_price
        ),
        barcode: option.barcode?.trim()
          ? option.barcode.trim()
          : null,
        active: option.active,
      })

      setEditingLiquidOptionId(null)

      await loadLiquidOptions(editingProduct.id)
    } catch (error) {
      console.error(error)

      const message =
        error.response?.data?.detail ||
        'Unable to update package price.'

      alert(message)
    } finally {
      setSavingLiquidOption(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      alert('Product name is required.')
      return
    }

    if (
      form.product_type === 'unit' &&
      !form.barcode.trim()
    ) {
      alert('Barcode is required for unit products.')
      return
    }

    if (!form.category_id) {
      alert('Please select a category.')
      return
    }

    if (
      form.product_type !== 'liquid' &&
      Number(form.price) <= 0
    ) {
      alert('Selling price must be greater than zero.')
      return
    }

    if (Number(form.cost_price) <= 0) {
      alert('Cost price must be greater than zero.')
      return
    }

    if (
      Number(form.stock) < 0 ||
      Number(form.reorder_level) < 0
    ) {
      alert('Stock values cannot be negative.')
      return
    }

    if (
      form.product_type === 'unit' &&
      (!Number.isInteger(Number(form.stock)) ||
        !Number.isInteger(
          Number(form.reorder_level)
        ))
    ) {
      alert(
        'Unit products must use whole numbers for stock and reorder level.'
      )
      return
    }

    try {
      setSaving(true)

      const productData = {
        name: form.name.trim(),
        barcode: form.barcode.trim()
          ? form.barcode.trim()
          : null,
        product_type: form.product_type,

        // Temporary backend compatibility:
        // liquid products do not use the base price.
        price:
          form.product_type === 'liquid'
            ? 1
            : Number(form.price),

        cost_price: Number(form.cost_price),
        reorder_level: Number(form.reorder_level),
        category_id: Number(form.category_id),
      }

      let savedProduct

if (editingProduct) {
  const response = await api.patch(
    `/products/${editingProduct.id}`,
    productData
  )

  savedProduct = response.data
} else {
  const response = await api.post('/products/', {
    ...productData,
    stock: Number(form.stock),
  })

  savedProduct = response.data
}

if (!editingProduct && form.product_type === 'liquid') {
  setEditingProduct(savedProduct)
  setLiquidOptions([])

  setNewLiquidOption({
    volume_ml: '',
    selling_price: '',
    barcode: '',
  })

  alert(
    'Liquid product created. You can now add its package prices.'
  )
} else {
  setShowModal(false)
  setEditingProduct(null)
  setLiquidOptions([])
  setEditingLiquidOptionId(null)

  setNewLiquidOption({
    volume_ml: '',
    selling_price: '',
    barcode: '',
  })
}

await loadProducts()

      setNewLiquidOption({
        volume_ml: '',
        selling_price: '',
        barcode: '',
      })

      await loadProducts()
    } catch (error) {
      console.error(error)

      const message =
        error.response?.data?.detail ||
        'Unable to save product.'

      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      await api.delete(`/products/${product.id}`)
      await loadProducts()
    } catch (error) {
      console.error(error)

      const message =
        error.response?.data?.detail ||
        'Unable to delete product.'

      alert(message)
    }
  }

  const formatCurrency = (value) => {
    return `Rs. ${Number(value || 0).toLocaleString(
      'en-LK',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`
  }

  const formatStock = (product) => {
    if (product.product_type === 'weight') {
      return `${Number(
        product.stock || 0
      ).toFixed(3)} kg`
    }

    if (product.product_type === 'liquid') {
      return `${Number(
        product.stock || 0
      ).toFixed(3)} L`
    }

    return Math.round(
      Number(product.stock || 0)
    )
  }

  const formatReorderLevel = (product) => {
    if (product.product_type === 'weight') {
      return `${Number(
        product.reorder_level || 0
      ).toFixed(3)} kg`
    }

    if (product.product_type === 'liquid') {
      return `${Number(
        product.reorder_level || 0
      ).toFixed(3)} L`
    }

    return Math.round(
      Number(product.reorder_level || 0)
    )
  }

  return (
    <div className="products-page">
      <div className="page-heading products-heading">
        <div>
          <p className="page-eyebrow">
            INVENTORY
          </p>

          <h1>Products</h1>

          <p className="page-description">
            Manage the products available at
            Sirisara Stores.
          </p>
        </div>

        {isAdmin && (
          <button
            className="primary-button"
            onClick={openAddModal}
          >
            <span>+</span>
            Add Product
          </button>
        )}
      </div>

      <div className="products-toolbar">
        <div className="product-search">
          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search by product name, barcode or category..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="product-count">
          Showing{' '}
          <strong>
            {filteredProducts.length}
          </strong>{' '}
          of{' '}
          <strong>
            {products.length}
          </strong>{' '}
          products
        </div>
      </div>

      {loading ? (
        <div className="products-state">
          Loading products...
        </div>
      ) : error ? (
        <div className="products-state error">
          {error}
        </div>
      ) : (
        <div className="products-card">
          {filteredProducts.length === 0 ? (
            <div className="products-empty">
              <div className="empty-product-icon">
                ▦
              </div>

              <strong>
                {search
                  ? 'No products found'
                  : 'No products available'}
              </strong>

              <p>
                {search
                  ? 'Try changing your search.'
                  : 'Add your first product to get started.'}
              </p>

              {isAdmin && !search && (
                <button
                  className="primary-button"
                  onClick={openAddModal}
                >
                  <span>+</span>
                  Add Product
                </button>
              )}
            </div>
          ) : (
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>TYPE</th>
                    <th>BARCODE</th>
                    <th>CATEGORY</th>
                    <th>SELLING PRICE</th>
                    <th>COST PRICE</th>
                    <th>STOCK</th>
                    <th>STATUS</th>

                    {isAdmin && (
                      <th>ACTIONS</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product) => {
                      const isLowStock =
                        product.stock <=
                        product.reorder_level

                      return (
                        <tr
                          key={product.id}
                        >
                          <td>
                            <div className="product-name-cell">
                              <div className="product-mini-icon">
                                {product.name
                                  ?.charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {product.name}
                                </strong>

                                <span>
                                  Product #
                                  {product.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {product.product_type ===
                            'weight' ? (
                              <span className="category-badge">
                                Weight
                              </span>
                            ) : product.product_type ===
                              'liquid' ? (
                              <span className="category-badge">
                                Liquid
                              </span>
                            ) : (
                              <span className="category-badge">
                                Unit
                              </span>
                            )}
                          </td>

                          <td>
                            <span className="barcode-text">
                              {product.barcode ||
                                '—'}
                            </span>
                          </td>

                          <td>
                            <span className="category-badge">
                              {getCategoryName(
                                product.category_id
                              )}
                            </span>
                          </td>

                          <td>
                            <strong className="price-text">
                              {product.product_type ===
                              'liquid'
                                ? 'Package prices'
                                : formatCurrency(
                                    product.price
                                  )}

                              {product.product_type ===
                                'weight' && (
                                <small>
                                  {' '}
                                  / kg
                                </small>
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="cost-text">
                              {formatCurrency(
                                product.cost_price
                              )}

                              {(product.product_type ===
                                'weight' ||
                                product.product_type ===
                                  'liquid') && (
                                <small>
                                  {' '}
                                  / kg
                                </small>
                              )}
                            </span>
                          </td>

                          <td>
                            <strong
                              className={
                                isLowStock
                                  ? 'stock-number low'
                                  : 'stock-number'
                              }
                            >
                              {formatStock(
                                product
                              )}
                            </strong>
                          </td>

                          <td>
                            {isLowStock ? (
                              <span className="status-badge warning">
                                Low Stock
                              </span>
                            ) : (
                              <span className="status-badge good">
                                In Stock
                              </span>
                            )}
                          </td>

                          {isAdmin && (
                            <td>
                              <div className="product-actions">
                                <button
                                  className="table-action edit"
                                  onClick={() =>
                                    openEditModal(
                                      product
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  className="table-action delete"
                                  onClick={() =>
                                    handleDelete(
                                      product
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={closeModal}
        >
          <div
            className="product-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  {editingProduct
                    ? 'PRODUCT'
                    : 'INVENTORY'}
                </p>

                <h2>
                  {editingProduct
                    ? 'Edit Product'
                    : 'Add Product'}
                </h2>

                <p>
                  {editingProduct
                    ? 'Update the product information below.'
                    : 'Enter the details for the new product.'}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="product-form"
              onSubmit={handleSubmit}
            >
              <div className="form-grid">
                <div className="form-group full">
                  <label>
                    Product Name
                  </label>

                  <input
                    name="name"
                    type="text"
                    placeholder="e.g. Anchor Milk Powder"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Product Type
                  </label>

                  <select
                    name="product_type"
                    value={
                      form.product_type
                    }
                    onChange={
                      handleProductTypeChange
                    }
                  >
                    <option value="unit">
                      Unit Product
                    </option>

                    <option value="weight">
                      Weight Product
                    </option>

                    <option value="liquid">
                      Liquid Product
                    </option>
                  </select>

                  <small>
                    {form.product_type ===
                    'weight'
                      ? 'Sold by weight. Price is per kg.'
                      : form.product_type ===
                        'liquid'
                        ? 'Sold by volume using package sizes.'
                        : 'Sold as whole units.'}
                  </small>
                </div>

                <div className="form-group">
                  <label>
                    Barcode
                    {form.product_type !==
                      'unit' && (
                      <span>
                        {' '}
                        (Optional)
                      </span>
                    )}
                  </label>

                  <input
                    name="barcode"
                    type="text"
                    placeholder={
                      form.product_type ===
                      'unit'
                        ? 'Enter barcode'
                        : 'Optional'
                    }
                    value={form.barcode}
                    onChange={handleChange}
                    required={
                      form.product_type ===
                      'unit'
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Category
                  </label>

                  <select
                    name="category_id"
                    value={
                      form.category_id
                    }
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {form.product_type !==
                  'liquid' && (
                  <div className="form-group">
                    <label>
                      {form.product_type ===
                      'weight'
                        ? 'Selling Price / kg'
                        : 'Selling Price'}
                    </label>

                    <div className="input-prefix">
                      <span>Rs.</span>

                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.price}
                        onChange={
                          handleChange
                        }
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>
                    {form.product_type ===
                    'weight'
                      ? 'Cost Price / kg'
                      : 'Cost Price'}
                  </label>

                  <div className="input-prefix">
                    <span>Rs.</span>

                    <input
                      name="cost_price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={
                        form.cost_price
                      }
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    {editingProduct
                      ? 'Current Stock'
                      : 'Initial Stock'}
                  </label>

                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step={
                      form.product_type ===
                      'unit'
                        ? '1'
                        : '0.001'
                    }
                    placeholder={
                      form.product_type ===
                      'unit'
                        ? '0'
                        : form.product_type ===
                          'weight'
                          ? 'e.g. 25.500'
                          : 'e.g. 0.000'
                    }
                    value={form.stock}
                    onChange={handleChange}
                    disabled={
                      !!editingProduct
                    }
                    required={!editingProduct}
                  />

                  {editingProduct && (
                    <small>
                      Use Stock Management to
                      change stock.
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Reorder Level
                  </label>

                  <input
                    name="reorder_level"
                    type="number"
                    min="0"
                    step={
                      form.product_type ===
                      'unit'
                        ? '1'
                        : '0.001'
                    }
                    placeholder={
                      form.product_type ===
                      'unit'
                        ? 'e.g. 10'
                        : form.product_type ===
                          'weight'
                          ? 'e.g. 5.000'
                          : 'e.g. 1.000'
                    }
                    value={
                      form.reorder_level
                    }
                    onChange={handleChange}
                    required
                  />

                  <small>
                    {form.product_type ===
                    'weight'
                      ? 'Measured in kg.'
                      : form.product_type ===
                        'liquid'
                        ? 'Measured in litres.'
                        : 'Measured in units.'}
                  </small>
                </div>
              </div>

              {form.product_type ===
                'liquid' && (
                <div className="liquid-options-section">
                  <div className="liquid-options-header">
                    <div>
                      <h3>
                        Package Prices
                      </h3>

                      <p>
                        Set the selling price
                        for each package size.
                      </p>
                    </div>
                  </div>

                  {editingProduct ? (
                    <>
                      {loadingLiquidOptions ? (
                        <div className="liquid-options-loading">
                          Loading package
                          prices...
                        </div>
                      ) : liquidOptions.length >
                        0 ? (
                        <div className="liquid-options-list">
                          {liquidOptions.map(
                            (option) => (
                              <div
                                className="liquid-option-row"
                                key={
                                  option.id
                                }
                              >
                                {editingLiquidOptionId ===
                                option.id ? (
                                  <>
                                    <div className="form-group">
                                      <label>
                                        Size
                                      </label>

                                      <div className="input-suffix">
                                        <input
                                          type="number"
                                          min="1"
                                          step="1"
                                          value={
                                            option.volume_ml
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            handleExistingLiquidOptionChange(
                                              option.id,
                                              'volume_ml',
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                        />

                                        <span>
                                          ml
                                        </span>
                                      </div>
                                    </div>

                                    <div className="form-group">
                                      <label>
                                        Price
                                      </label>

                                      <div className="input-prefix">
                                        <span>
                                          Rs.
                                        </span>

                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={
                                            option.selling_price
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            handleExistingLiquidOptionChange(
                                              option.id,
                                              'selling_price',
                                              event
                                                .target
                                                .value
                                            )
                                          }
                                        />
                                      </div>
                                    </div>

                                    <div className="form-group">
                                      <label>
                                        Barcode
                                      </label>

                                      <input
                                        type="text"
                                        placeholder="Optional"
                                        value={
                                          option.barcode ||
                                          ''
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          handleExistingLiquidOptionChange(
                                            option.id,
                                            'barcode',
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                      />
                                    </div>

                                    <div className="liquid-option-actions">
                                      <button
                                        type="button"
                                        className="table-action edit"
                                        onClick={() =>
                                          handleUpdateLiquidOption(
                                            option.id
                                          )
                                        }
                                        disabled={
                                          savingLiquidOption
                                        }
                                      >
                                        {savingLiquidOption
                                          ? 'Saving...'
                                          : 'Save'}
                                      </button>

                                      <button
                                        type="button"
                                        className="table-action delete"
                                        onClick={() =>
                                          setEditingLiquidOptionId(
                                            null
                                          )
                                        }
                                        disabled={
                                          savingLiquidOption
                                        }
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="liquid-option-size">
                                      {
                                        option.volume_ml
                                      }
                                      ml
                                    </div>

                                    <div className="liquid-option-price">
                                      Rs.{' '}
                                      {Number(
                                        option.selling_price
                                      ).toLocaleString(
                                        'en-LK',
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}
                                    </div>

                                    <div className="liquid-option-barcode">
                                      {option.barcode ||
                                        'No barcode'}
                                    </div>

                                    <span
                                      className={
                                        option.active
                                          ? 'status-badge good'
                                          : 'status-badge warning'
                                      }
                                    >
                                      {option.active
                                        ? 'Active'
                                        : 'Inactive'}
                                    </span>

                                    <button
                                      type="button"
                                      className="table-action edit"
                                      onClick={() =>
                                        setEditingLiquidOptionId(
                                          option.id
                                        )
                                      }
                                    >
                                      Edit
                                    </button>
                                  </>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="liquid-options-empty">
                          No package prices
                          configured yet.
                        </div>
                      )}

                      <div className="liquid-option-form">
                        <div className="form-group">
                          <label>
                            Package Size
                          </label>

                          <div className="input-suffix">
                            <input
                              name="volume_ml"
                              type="number"
                              min="1"
                              step="1"
                              placeholder="e.g. 175"
                              value={
                                newLiquidOption.volume_ml
                              }
                              onChange={
                                handleLiquidOptionChange
                              }
                            />

                            <span>
                              ml
                            </span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>
                            Selling Price
                          </label>

                          <div className="input-prefix">
                            <span>
                              Rs.
                            </span>

                            <input
                              name="selling_price"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="e.g. 175.00"
                              value={
                                newLiquidOption.selling_price
                              }
                              onChange={
                                handleLiquidOptionChange
                              }
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>
                            Barcode{' '}
                            <span>
                              (Optional)
                            </span>
                          </label>

                          <input
                            name="barcode"
                            type="text"
                            placeholder="Optional"
                            value={
                              newLiquidOption.barcode
                            }
                            onChange={
                              handleLiquidOptionChange
                            }
                          />
                        </div>

                        <div className="liquid-option-add">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={
                              handleAddLiquidOption
                            }
                            disabled={
                              savingLiquidOption
                            }
                          >
                            {savingLiquidOption
                              ? 'Adding...'
                              : '+ Add Package'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="liquid-options-empty">
                      Save the liquid product
                      first, then add its
                      package prices.
                    </div>
                  )}
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={
                    saving ||
                    savingLiquidOption
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingProduct
                      ? 'Save Changes'
                      : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products