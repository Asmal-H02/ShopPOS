import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function Categories() {
  const { user } = useAuth()

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'admin'

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError('')

      const [categoriesResponse, productsResponse] = await Promise.all([
        api.get('/categories/'),
        api.get('/products/'),
      ])

      setCategories(categoriesResponse.data)
      setProducts(productsResponse.data)
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.detail ||
          'Unable to load categories. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const getProductCount = (categoryId) => {
    return products.filter(
      (product) => product.category_id === categoryId
    ).length
  }

  const openAddModal = () => {
    setEditingCategory(null)
    setName('')
    setShowModal(true)
  }

  const openEditModal = (category) => {
    setEditingCategory(category)
    setName(category.name)
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingCategory(null)
    setName('')
  }

  const handleSave = async (event) => {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    try {
      setSaving(true)
      setError('')

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, {
          name: trimmedName,
        })
      } else {
        await api.post('/categories/', {
          name: trimmedName,
        })
      }

      closeModal()
      await loadCategories()
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.detail ||
          'Unable to save category. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category) => {
    const productCount = getProductCount(category.id)

    if (productCount > 0) {
      setError(
        `"${category.name}" cannot be deleted because it contains ${productCount} product${
          productCount === 1 ? '' : 's'
        }.`
      )
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await api.delete(`/categories/${category.id}`)

      await loadCategories()
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.detail ||
          'Unable to delete category. Please try again.'
      )
    }
  }

  return (
    <div className="categories-page">
      <div className="categories-heading">
        <div>
          <p className="page-eyebrow">INVENTORY ORGANIZATION</p>
          <h1>Categories</h1>
          <p>
            Organize your products into clear and manageable categories.
          </p>
        </div>

        {isAdmin && (
          <button
            className="primary-button"
            onClick={openAddModal}
          >
            + Add Category
          </button>
        )}
      </div>

      {error && (
        <div className="categories-error">
          {error}
        </div>
      )}

      <div className="categories-summary">
        <div className="category-summary-card">
          <span className="summary-icon">◫</span>

          <div>
            <span className="summary-label">Total Categories</span>
            <strong>{categories.length}</strong>
          </div>
        </div>

        <div className="category-summary-card">
          <span className="summary-icon">▦</span>

          <div>
            <span className="summary-label">Products Organized</span>
            <strong>{products.length}</strong>
          </div>
        </div>
      </div>

      <div className="categories-card">
        <div className="categories-card-header">
          <div>
            <h2>Category List</h2>
            <p>
              {isAdmin
                ? 'Manage your store categories.'
                : 'Browse your store categories.'}
            </p>
          </div>

          <span className="category-count">
            {categories.length} categor
            {categories.length === 1 ? 'y' : 'ies'}
          </span>
        </div>

        {loading ? (
          <div className="categories-state">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="categories-empty">
            <div className="empty-icon">◫</div>
            <h3>No categories yet</h3>

            <p>
              {isAdmin
                ? 'Create your first category to start organizing products.'
                : 'There are currently no categories available.'}
            </p>

            {isAdmin && (
              <button
                className="secondary-button"
                onClick={openAddModal}
              >
                + Add Category
              </button>
            )}
          </div>
        ) : (
          <div className="categories-table-wrapper">
            <table className="categories-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Status</th>

                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => {
                  const productCount = getProductCount(category.id)

                  return (
                    <tr key={category.id}>
                      <td>
                        <div className="category-name-cell">
                          <div className="category-icon">
                            ◫
                          </div>

                          <div>
                            <strong>{category.name}</strong>
                            <span>
                              Category #{category.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="product-count">
                          {productCount}
                        </span>
                      </td>

                      <td>
                        <span className="category-status">
                          {productCount > 0
                            ? 'Active'
                            : 'Empty'}
                        </span>
                      </td>

                      {isAdmin && (
                        <td>
                          <div className="category-actions">
                            <button
                              className="table-action edit"
                              onClick={() =>
                                openEditModal(category)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="table-action delete"
                              onClick={() =>
                                handleDelete(category)
                              }
                            >
                              Delete
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

      {showModal && (
        <div className="modal-overlay">
          <div className="category-modal">
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  CATEGORY MANAGEMENT
                </p>

                <h2>
                  {editingCategory
                    ? 'Edit Category'
                    : 'Add Category'}
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

            <form
              className="category-form"
              onSubmit={handleSave}
            >
              <div className="form-group">
                <label htmlFor="category-name">
                  Category Name
                </label>

                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Beverages"
                  autoFocus
                  required
                />
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
                  disabled={saving || !name.trim()}
                >
                  {saving
                    ? 'Saving...'
                    : editingCategory
                      ? 'Save Changes'
                      : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories