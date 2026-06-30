import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getAllCategories } from "../services/categoriesService";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  changeProductStatus,
} from "../services/productsService";
import {
  FaBoxOpen,
  FaExclamationTriangle,
  FaPlus,
  FaSearch,
  FaCheckCircle,
} from "react-icons/fa";
import "../styles/Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const initialFormData = {
    name: "",
    description: "",
    barcode: "",
    purchasePrice: "",
    salePrice: "",
    stock: "",
    minimumStock: "",
    active: true,
    category: {
      id: "",
    },
  };

  const [formData, setFormData] = useState(initialFormData);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllProducts();

      console.log("Products data:", data);

      setProducts(data.responseObject || data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      const categoryList = data.responseObject || data;

      setCategories(categoryList.filter((category) => category.active));
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      setError("No se pudieron cargar las categorías.");
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingProduct(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "categoryId") {
      setFormData({
        ...formData,
        category: {
          id: value,
        },
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const productToSave = {
        ...formData,
        barcode: formData.barcode || null,
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock),
        minimumStock: Number(formData.minimumStock),
        category: {
          id: Number(formData.category.id),
        },
      };

      console.log("Producto a guardar:", productToSave);

      if (editingProduct) {
        await updateProduct(editingProduct.id, productToSave);
        setSuccess("Producto actualizado correctamente.");
      } else {
        await createProduct(productToSave);
        setSuccess("Producto registrado correctamente.");
      }

      resetForm();
      setShowForm(false);
      loadProducts();
    } catch (error) {
      console.error("Error al guardar producto:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo guardar el producto.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name || "",
      description: product.description || "",
      barcode: product.barcode || "",
      purchasePrice: product.purchasePrice ?? "",
      salePrice: product.salePrice ?? "",
      stock: product.stock ?? "",
      minimumStock: product.minimumStock ?? 0,
      active: product.active ?? true,
      category: {
        id: product.categoryId || product.category?.id || "",
      },
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleNewProduct = () => {
    resetForm();
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setError("");
    setSuccess("");
  };

  const handleChangeStatus = async (product) => {
    const confirmChange = window.confirm(
      `¿Seguro que deseas cambiar el estado del producto "${product.name}"?`
    );

    if (!confirmChange) return;

    try {
      setError("");
      setSuccess("");

      await changeProductStatus(product.id);

      setSuccess("Estado del producto actualizado correctamente.");
      loadProducts();
    } catch (error) {
      console.error("Error al cambiar estado del producto:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo cambiar el estado del producto.";

      setError(message);
    }
  };

  const filteredProducts = products.filter((product) => {
    const categoryName = product.categoryName || product.category?.name || "";
    const categoryId = product.categoryId || product.category?.id || "";

    const text = `${product.name} ${product.barcode || ""} ${categoryName}`.toLowerCase();

    const matchesSearch = text.includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "" || Number(categoryId) === Number(categoryFilter);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && product.active) ||
      (statusFilter === "INACTIVE" && !product.active);

    const stock = Number(product.stock);
    const minimumStock = Number(product.minimumStock);

    const matchesStock =
      stockFilter === "ALL" ||
      (stockFilter === "AVAILABLE" && stock > minimumStock) ||
      (stockFilter === "LOW" && stock > 0 && stock <= minimumStock) ||
      (stockFilter === "EMPTY" && stock === 0);

    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  const activeProducts = products.filter((product) => product.active).length;

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock) > 0 &&
      Number(product.stock) <= Number(product.minimumStock)
  ).length;

  const emptyStockProducts = products.filter(
    (product) => Number(product.stock) === 0
  ).length;

  const getStockClass = (product) => {
    const stock = Number(product.stock);
    const minimumStock = Number(product.minimumStock);

    if (stock === 0) return "stock-badge stock-empty";
    if (stock <= minimumStock) return "stock-badge stock-low";
    return "stock-badge stock-ok";
  };

  const getStockText = (product) => {
    const stock = Number(product.stock);
    const minimumStock = Number(product.minimumStock);

    if (stock === 0) return "Sin stock";
    if (stock <= minimumStock) return "Stock bajo";
    return "Disponible";
  };
  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("ALL");
    setStockFilter("ALL");
  };
  return (
    <MainLayout>
      <div className="products-page">
        <div className="products-header">
          <div className="products-title">
            <h1>Productos</h1>
            <p>Gestión de productos de la tienda.</p>
          </div>

          <button
            className="btn btn-primary products-new-btn"
            onClick={handleNewProduct}
          >
            <FaPlus className="me-2" />
            Nuevo producto
          </button>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="products-summary-card">
              <div className="products-summary-body">
                <div className="products-summary-icon blue">
                  <FaBoxOpen />
                </div>
                <p className="products-summary-label">Total productos</p>
                <h3 className="products-summary-value">{products.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="products-summary-card">
              <div className="products-summary-body">
                <div className="products-summary-icon green">
                  <FaCheckCircle />
                </div>
                <p className="products-summary-label">Productos activos</p>
                <h3 className="products-summary-value">{activeProducts}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="products-summary-card">
              <div className="products-summary-body">
                <div className="products-summary-icon yellow">
                  <FaExclamationTriangle />
                </div>
                <p className="products-summary-label">Stock bajo</p>
                <h3 className="products-summary-value">{lowStockProducts}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="products-summary-card">
              <div className="products-summary-body">
                <div className="products-summary-icon red">
                  <FaExclamationTriangle />
                </div>
                <p className="products-summary-label">Sin stock</p>
                <h3 className="products-summary-value">{emptyStockProducts}</h3>
              </div>
            </div>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        {error && <div className="alert alert-danger">{error}</div>}

        {showForm && (
          <div className="card product-form-card mb-4">
            <div className="card-body">
              <h5 className="product-form-title mb-3">
                {editingProduct ? "Editar producto" : "Nuevo producto"}
              </h5>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Ejemplo: Coca Cola 600ml"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Categoría</label>
                    <select
                      name="categoryId"
                      className="form-select"
                      value={formData.category.id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-12 mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      name="description"
                      className="form-control"
                      placeholder="Descripción del producto"
                      value={formData.description}
                      onChange={handleChange}
                      rows="2"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Código de barras</label>
                    <input
                      type="text"
                      name="barcode"
                      className="form-control"
                      placeholder="Ejemplo: 7501234567890"
                      value={formData.barcode}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Stock mínimo</label>
                    <input
                      type="number"
                      name="minimumStock"
                      className="form-control"
                      placeholder="Ejemplo: 5"
                      value={formData.minimumStock}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Precio compra</label>
                    <input
                      type="number"
                      name="purchasePrice"
                      className="form-control"
                      placeholder="0.00"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Precio venta</label>
                    <input
                      type="number"
                      name="salePrice"
                      className="form-control"
                      placeholder="0.00"
                      value={formData.salePrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Stock</label>
                    <input
                      type="number"
                      name="stock"
                      className="form-control"
                      placeholder="0"
                      value={formData.stock}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3 d-flex align-items-end">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        name="active"
                        className="form-check-input"
                        checked={formData.active}
                        onChange={handleChange}
                        id="active"
                      />
                      <label className="form-check-label" htmlFor="active">
                        Producto activo
                      </label>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={saving}
                  >
                    {saving
                      ? "Guardando..."
                      : editingProduct
                        ? "Actualizar"
                        : "Guardar"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && (
          <div className="alert alert-info">Cargando productos...</div>
        )}

        {!loading && (
          <div className="card products-card">
            <div className="card-body">
              <div className="products-toolbar">
                <div>
                  <h5 className="product-form-title mb-1">
                    Listado de productos
                  </h5>
                  <p className="text-muted mb-0">
                    {filteredProducts.length} producto(s) encontrados.
                  </p>
                </div>

                <div className="products-search">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar producto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="products-filters">
                <select
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="INACTIVE">Inactivos</option>
                </select>

                <select
                  className="form-select"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="ALL">Todo el stock</option>
                  <option value="AVAILABLE">Disponible</option>
                  <option value="LOW">Stock bajo</option>
                  <option value="EMPTY">Sin stock</option>
                </select>

                <button
                  type="button"
                  className="btn btn-outline-secondary products-clear-btn"
                  onClick={clearFilters}
                >
                  Limpiar
                </button>
              </div>


              <div className="products-table-wrapper">
                <table className="table table-hover align-middle products-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Compra</th>
                      <th>Venta</th>
                      <th>Stock</th>
                      <th>Mínimo</th>
                      <th>Estado stock</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-4">
                          No hay productos registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="product-name">{product.name}</div>
                            <div className="product-barcode">
                              {product.barcode
                                ? `Código: ${product.barcode}`
                                : "Sin código"}
                            </div>
                          </td>

                          <td>
                            {product.categoryName ||
                              product.category?.name ||
                              "Sin categoría"}
                          </td>

                          <td>
                            ${Number(product.purchasePrice || 0).toFixed(2)}
                          </td>

                          <td>${Number(product.salePrice || 0).toFixed(2)}</td>

                          <td>{product.stock}</td>

                          <td>{product.minimumStock ?? 0}</td>

                          <td>
                            <span className={getStockClass(product)}>
                              {getStockText(product)}
                            </span>
                          </td>

                          <td>
                            {product.active ? (
                              <span className="badge bg-success status-badge">
                                Activo
                              </span>
                            ) : (
                              <span className="badge bg-secondary status-badge">
                                Inactivo
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(product)}
                              >
                                Editar
                              </button>

                              <button
                                className={
                                  product.active
                                    ? "btn btn-sm btn-outline-danger"
                                    : "btn btn-sm btn-outline-success"
                                }
                                onClick={() => handleChangeStatus(product)}
                              >
                                {product.active ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Products;