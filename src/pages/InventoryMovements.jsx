import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getAllProducts } from "../services/productsService";
import {
  createInventoryMovement,
  getAllInventoryMovements,
} from "../services/inventoryService";
import {
  FaArrowDown,
  FaArrowUp,
  FaBoxes,
  FaExchangeAlt,
  FaPlus,
  FaSearch,
  FaUndo,
} from "react-icons/fa";
import "../styles/InventoryMovements.css";

function InventoryMovements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);

  const initialFormData = {
    productId: "",
    type: "PURCHASE",
    quantity: "",
    reason: "",
    userId: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllInventoryMovements();

      console.log("Inventory movements data:", data);

      setMovements(data.responseObject || data);
    } catch (error) {
      console.error("Error al cargar movimientos de inventario:", error);
      setError("No se pudieron cargar los movimientos de inventario.");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getAllProducts();
      const productList = data.responseObject || data;

      setProducts(productList.filter((product) => product.active));
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setError("No se pudieron cargar los productos.");
    }
  };

  useEffect(() => {
    loadMovements();
    loadProducts();
  }, []);

  const getMovementBadge = (type) => {
    if (type === "PURCHASE") {
      return <span className="inventory-type-badge purchase">Compra</span>;
    }

    if (type === "SALE") {
      return <span className="inventory-type-badge sale">Venta / Salida</span>;
    }

    if (type === "ADJUSTMENT") {
      return <span className="inventory-type-badge adjustment">Ajuste</span>;
    }

    if (type === "RETURN") {
      return <span className="inventory-type-badge return">Devolución</span>;
    }

    return <span className="inventory-type-badge default">{type || "Sin tipo"}</span>;
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleNewMovement = () => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const getSelectedProduct = () => {
    return products.find((product) => product.id === Number(formData.productId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const selectedProduct = getSelectedProduct();
      const quantity = Number(formData.quantity);

      if (!formData.productId) {
        setError("Selecciona un producto.");
        setSaving(false);
        return;
      }

      if (!quantity || quantity <= 0) {
        setError("La cantidad debe ser mayor a 0.");
        setSaving(false);
        return;
      }

      if (
        formData.type === "SALE" &&
        selectedProduct &&
        quantity > Number(selectedProduct.stock)
      ) {
        setError(
          `Stock insuficiente. El producto solo tiene ${selectedProduct.stock} unidades disponibles.`
        );
        setSaving(false);
        return;
      }

      const movementToSave = {
        productId: Number(formData.productId),
        type: formData.type,
        quantity: quantity,
        reason: formData.reason,
        userId: formData.userId ? Number(formData.userId) : null,
      };

      console.log("Movimiento a guardar:", movementToSave);

      await createInventoryMovement(movementToSave);

      setSuccess("Movimiento de inventario registrado correctamente.");
      resetForm();
      setShowForm(false);
      loadMovements();
      loadProducts();
    } catch (error) {
      console.error("Error al guardar movimiento:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo registrar el movimiento de inventario.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Sin fecha";

    return new Date(date).toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedProduct = getSelectedProduct();

  const purchaseMovements = movements.filter(
    (movement) => movement.type === "PURCHASE"
  ).length;

  const saleMovements = movements.filter(
    (movement) => movement.type === "SALE"
  ).length;

  const adjustmentMovements = movements.filter(
    (movement) => movement.type === "ADJUSTMENT"
  ).length;

  const returnMovements = movements.filter(
    (movement) => movement.type === "RETURN"
  ).length;

  const filteredMovements = movements.filter((movement) => {
    const text = `${movement.id} ${movement.productName || ""} ${
      movement.type || ""
    } ${movement.reason || ""} ${movement.userName || ""} ${
      movement.saleFolio || ""
    }`.toLowerCase();

    const matchesSearch = text.includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "ALL" || movement.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
  };

  return (
    <MainLayout>
      <div className="inventory-page">
        <div className="inventory-header">
          <div className="inventory-title">
            <h1>Inventario</h1>
            <p>Historial de compras, ventas, devoluciones y ajustes de productos.</p>
          </div>

          <button
            className="btn btn-primary inventory-new-btn"
            onClick={handleNewMovement}
          >
            <FaPlus className="me-2" />
            Nuevo movimiento
          </button>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="inventory-summary-card">
              <div className="inventory-summary-body">
                <div className="inventory-summary-icon blue">
                  <FaExchangeAlt />
                </div>
                <p className="inventory-summary-label">Movimientos</p>
                <h3 className="inventory-summary-value">{movements.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="inventory-summary-card">
              <div className="inventory-summary-body">
                <div className="inventory-summary-icon green">
                  <FaArrowUp />
                </div>
                <p className="inventory-summary-label">Compras</p>
                <h3 className="inventory-summary-value">{purchaseMovements}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="inventory-summary-card">
              <div className="inventory-summary-body">
                <div className="inventory-summary-icon red">
                  <FaArrowDown />
                </div>
                <p className="inventory-summary-label">Ventas / salidas</p>
                <h3 className="inventory-summary-value">{saleMovements}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="inventory-summary-card">
              <div className="inventory-summary-body">
                <div className="inventory-summary-icon yellow">
                  <FaBoxes />
                </div>
                <p className="inventory-summary-label">Ajustes</p>
                <h3 className="inventory-summary-value">{adjustmentMovements}</h3>
              </div>
            </div>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        {error && <div className="alert alert-danger">{error}</div>}

        {showForm && (
          <div className="card inventory-form-card mb-4">
            <div className="card-body">
              <h5>Nuevo movimiento de inventario</h5>
              <p>Registra una entrada, salida, devolución o ajuste de stock.</p>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Producto</label>
                    <select
                      name="productId"
                      className="form-select"
                      value={formData.productId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona un producto</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - Stock: {product.stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tipo de movimiento</label>
                    <select
                      name="type"
                      className="form-select"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="PURCHASE">Compra / Entrada</option>
                      <option value="SALE">Venta / Salida</option>
                      <option value="RETURN">Devolución</option>
                      <option value="ADJUSTMENT">Ajuste</option>
                    </select>
                  </div>

                  {selectedProduct && (
                    <div className="col-md-12 mb-3">
                      <div className="inventory-product-alert">
                        <div>
                          <span>Producto seleccionado</span>
                          <strong>{selectedProduct.name}</strong>
                        </div>

                        <div>
                          <span>Stock actual</span>
                          <strong>{selectedProduct.stock}</strong>
                        </div>

                        <div>
                          <span>Stock mínimo</span>
                          <strong>{selectedProduct.minimumStock ?? 0}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {formData.type === "ADJUSTMENT"
                        ? "Nuevo stock final"
                        : "Cantidad"}
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control"
                      placeholder={
                        formData.type === "ADJUSTMENT"
                          ? "Ejemplo: 50"
                          : "Ejemplo: 10"
                      }
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      required
                    />

                    {formData.type === "ADJUSTMENT" && (
                      <small className="text-muted">
                        En ajuste, la cantidad será el nuevo stock final.
                      </small>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">ID Usuario</label>
                    <input
                      type="number"
                      name="userId"
                      className="form-control"
                      placeholder="Opcional, ejemplo: 1"
                      value={formData.userId}
                      onChange={handleChange}
                      min="1"
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label className="form-label">Motivo</label>
                    <textarea
                      name="reason"
                      className="form-control"
                      placeholder="Ejemplo: Compra de mercancía"
                      value={formData.reason}
                      onChange={handleChange}
                      rows="2"
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Guardar movimiento"}
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
          <div className="alert alert-info">
            Cargando movimientos de inventario...
          </div>
        )}

        {!loading && (
          <div className="card inventory-card">
            <div className="card-body">
              <div className="inventory-toolbar">
                <div>
                  <h5>Historial de inventario</h5>
                  <p>{filteredMovements.length} movimiento(s) encontrados.</p>
                </div>

                <div className="inventory-search">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar producto, motivo o usuario..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="inventory-filters">
                <select
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="ALL">Todos los tipos</option>
                  <option value="PURCHASE">Compras</option>
                  <option value="SALE">Ventas / salidas</option>
                  <option value="RETURN">Devoluciones</option>
                  <option value="ADJUSTMENT">Ajustes</option>
                </select>

                <button
                  type="button"
                  className="btn btn-outline-secondary inventory-clear-btn"
                  onClick={clearFilters}
                >
                  Limpiar
                </button>
              </div>

              <div className="inventory-table-wrapper">
                <table className="table table-hover align-middle inventory-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Producto</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Stock anterior</th>
                      <th>Stock nuevo</th>
                      <th>Motivo</th>
                      <th>Usuario</th>
                      <th>Venta</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center text-muted py-4">
                          No hay movimientos de inventario registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map((movement) => (
                        <tr key={movement.id}>
                          <td>
                            <strong>#{movement.id}</strong>
                          </td>

                          <td>
                            <div className="inventory-product-name">
                              {movement.productName || "Sin producto"}
                            </div>
                          </td>

                          <td>{getMovementBadge(movement.type)}</td>

                          <td>
                            <strong>{movement.quantity}</strong>
                          </td>

                          <td>{movement.previousStock}</td>

                          <td>
                            <strong>{movement.newStock}</strong>
                          </td>

                          <td>
                            <div className="inventory-reason">
                              {movement.reason || "Sin motivo"}
                            </div>
                          </td>

                          <td>{movement.userName || "Sin usuario"}</td>

                          <td>{movement.saleFolio || "-"}</td>

                          <td>{formatDate(movement.createdAt)}</td>
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

export default InventoryMovements;