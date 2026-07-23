import { useEffect, useRef, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getAllProducts } from "../services/productsService";
import {
  createSale,
  getAllSales,
  getSaleById,
  cancelSale,
} from "../services/salesService";
import {
  FaCashRegister,
  FaCheckCircle,
  FaPlus,
  FaSearch,
  FaTimesCircle,
  FaReceipt,
  FaTrash,
  FaEye,
} from "react-icons/fa";
import { getOpenCashRegister } from "../services/cashRegisterService";
import "../styles/Sales.css";

function Sales() {
  const authData = JSON.parse(localStorage.getItem("authData")) || {};
  const user = authData || JSON.parse(localStorage.getItem("user")) || {};

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [openRegister, setOpenRegister] = useState(null);

  const initialFormData = {
    userId: user?.id || "1",
    amountReceived: "",
    paymentMethod: "CASH",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [saleItems, setSaleItems] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [ticketSale, setTicketSale] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedQuantities, setSelectedQuantities] = useState({});

  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef(null);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllSales();

      console.log("Sales data:", data);

      setSales(data.responseObject || data);
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      setError("No se pudieron cargar las ventas.");
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

  const loadOpenCashRegister = async () => {
    try {
      const data = await getOpenCashRegister();

      if (!data.responseBoolean || !data.responseObject) {
        setOpenRegister(null);
        return null;
      }

      setOpenRegister(data.responseObject);
      return data.responseObject;
    } catch (error) {
      console.error("Error al validar caja abierta:", error);
      setOpenRegister(null);
      return null;
    }
  };

  useEffect(() => {
    loadSales();
    loadProducts();
    loadOpenCashRegister();
  }, []);

  useEffect(() => {
    if (showForm && barcodeInputRef.current) {
      setTimeout(() => {
        barcodeInputRef.current.focus();
      }, 200);
    }
  }, [showForm]);

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      userId: user?.id || "1",
    });

    setSaleItems([]);
    setSelectedQuantities({});
    setProductSearchTerm("");
    setBarcodeInput("");
  };

  const handleNewSale = async () => {
    setError("");
    setSuccess("");

    const cashRegister = await loadOpenCashRegister();

    if (!cashRegister) {
      setError("No hay caja abierta. Primero abre caja para poder registrar ventas.");
      return;
    }

    resetForm();
    setShowForm(true);
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

  const formatCurrency = (value) => {
    return `$${Number(value || 0).toFixed(2)}`;
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

  const getStatusBadge = (status) => {
    if (status === "COMPLETED") {
      return <span className="sale-status-badge completed">Completada</span>;
    }

    if (status === "CANCELLED") {
      return <span className="sale-status-badge cancelled">Cancelada</span>;
    }

    if (status === "PENDING") {
      return <span className="sale-status-badge pending">Pendiente</span>;
    }

    if (status === "ACTIVE") {
      return <span className="sale-status-badge completed">Activa</span>;
    }

    return (
      <span className="sale-status-badge default">
        {status || "Sin estado"}
      </span>
    );
  };

  const getPaymentMethodText = (paymentMethod) => {
    if (paymentMethod === "CASH") return "Efectivo";
    if (paymentMethod === "CARD") return "Tarjeta";
    if (paymentMethod === "TRANSFER") return "Transferencia";

    return paymentMethod || "Sin método";
  };

  const calculateTotal = () => {
    return saleItems.reduce((total, item) => {
      return total + Number(item.salePrice) * Number(item.quantity);
    }, 0);
  };

  const calculateChange = () => {
    const total = calculateTotal();
    const received = Number(formData.amountReceived || 0);

    return received - total;
  };

  const getProductQuantityInCart = (productId) => {
    const item = saleItems.find((item) => item.productId === productId);
    return item ? Number(item.quantity) : 0;
  };

  const getAvailableStock = (product) => {
    const stock = Number(product.stock || 0);
    const quantityInCart = getProductQuantityInCart(product.id);

    return stock - quantityInCart;
  };

  const handleProductQuantityChange = (productId, quantity) => {
    setSelectedQuantities({
      ...selectedQuantities,
      [productId]: quantity,
    });
  };

  const addProductToCart = (product, quantityToAdd = 1) => {
    setError("");
    setSuccess("");

    const quantity = Number(quantityToAdd || 1);
    const stock = Number(product.stock || 0);
    const quantityInCart = getProductQuantityInCart(product.id);
    const availableStock = stock - quantityInCart;

    if (stock <= 0) {
      setError(`"${product.name}" no tiene stock disponible.`);
      return false;
    }

    if (!quantity || quantity <= 0) {
      setError("La cantidad debe ser mayor a 0.");
      return false;
    }

    if (availableStock <= 0) {
      setError(
        `Ya agregaste todo el stock disponible de "${product.name}" al carrito.`
      );
      return false;
    }

    if (quantity > availableStock) {
      setError(
        `Stock insuficiente. Solo puedes agregar ${availableStock} ${availableStock === 1 ? "pieza más" : "piezas más"
        } de "${product.name}".`
      );
      return false;
    }

    const existingItem = saleItems.find((item) => item.productId === product.id);
    const newQuantity = quantityInCart + quantity;

    if (existingItem) {
      setSaleItems(
        saleItems.map((item) =>
          item.productId === product.id
            ? {
              ...item,
              quantity: newQuantity,
              subtotal: Number(product.salePrice) * newQuantity,
            }
            : item
        )
      );
    } else {
      setSaleItems([
        ...saleItems,
        {
          productId: product.id,
          productName: product.name,
          salePrice: Number(product.salePrice),
          stock: stock,
          quantity: quantity,
          subtotal: Number(product.salePrice) * quantity,
        },
      ]);
    }

    setSuccess(`Producto agregado: ${product.name}`);
    return true;
  };

  const handleAddProductToSale = (product) => {
    const quantity = Number(selectedQuantities[product.id] || 1);
    const added = addProductToCart(product, quantity);

    if (added) {
      setSelectedQuantities({
        ...selectedQuantities,
        [product.id]: "",
      });
    }
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const code = barcodeInput.trim();

    if (!code) {
      setError("Escanea o escribe un código de barras.");
      return;
    }

    const product = products.find(
      (item) => String(item.barcode || "").trim() === code
    );

    if (!product) {
      setError(`No se encontró ningún producto con el código "${code}".`);
      setBarcodeInput("");
      return;
    }

    const added = addProductToCart(product, 1);

    if (added) {
      setBarcodeInput("");
      setProductSearchTerm("");
    }
  };

  const handleRemoveItem = (productId) => {
    setSaleItems(saleItems.filter((item) => item.productId !== productId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (saleItems.length === 0) {
        setError("Agrega al menos un producto a la venta.");
        setSaving(false);
        return;
      }

      const total = calculateTotal();
      const amountReceived = Number(formData.amountReceived);

      if (!amountReceived || amountReceived < total) {
        setError("El monto recibido debe ser mayor o igual al total.");
        setSaving(false);
        return;
      }

      const saleToSave = {
        userId: Number(formData.userId),
        amountReceived: amountReceived,
        paymentMethod: formData.paymentMethod,
        details: saleItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      console.log("Venta a guardar:", saleToSave);

      const data = await createSale(saleToSave);
      const createdSale = data.responseObject || data;

      let saleForTicket = {
        ...createdSale,
        userName: user?.name || "Usuario actual",
        paymentMethod: formData.paymentMethod,
        amountReceived: amountReceived,
        changeAmount: amountReceived - total,
        total: total,
        details: saleItems.map((item) => ({
          id: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.salePrice,
          subtotal: item.subtotal,
        })),
      };

      if (createdSale?.id) {
        try {
          const detailData = await getSaleById(createdSale.id);
          saleForTicket = detailData.responseObject || detailData || saleForTicket;
        } catch (detailError) {
          console.warn("No se pudo cargar detalle completo del ticket:", detailError);
        }
      }

      setTicketSale(saleForTicket);
      setShowTicketModal(true);

      setSuccess("Venta registrada correctamente.");
      resetForm();
      setShowForm(false);
      await loadSales();
      await loadProducts();
      await loadOpenCashRegister();
    } catch (error) {
      console.error("Error al guardar venta:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo registrar la venta.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetail = async (saleId) => {
    try {
      setError("");
      setSuccess("");

      const data = await getSaleById(saleId);

      setSelectedSale(data.responseObject || data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error al obtener detalle de venta:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo obtener el detalle de la venta.";

      setError(message);
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedSale(null);
    setShowDetailModal(false);
  };

  const handleCloseTicketModal = () => {
    setTicketSale(null);
    setShowTicketModal(false);
  };

  const handlePrintTicket = () => {
    window.print();
  };

  const handleCancelSale = async (saleId) => {
    const confirmCancel = window.confirm(
      "¿Seguro que deseas cancelar esta venta?"
    );

    if (!confirmCancel) return;

    try {
      setError("");
      setSuccess("");

      const data = await cancelSale(saleId);

      setSuccess(data.responseString || "Venta cancelada correctamente.");

      await loadSales();
      await loadProducts();
      await loadOpenCashRegister();
    } catch (error) {
      console.error("Error al cancelar venta:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo cancelar la venta.";

      setError(message);
    }
  };

  const total = calculateTotal();
  const change = calculateChange();

  const completedSales = sales.filter(
    (sale) => sale.status === "COMPLETED" || sale.status === "ACTIVE"
  ).length;

  const cancelledSales = sales.filter(
    (sale) => sale.status === "CANCELLED"
  ).length;

  const totalSold = sales
    .filter((sale) => sale.status !== "CANCELLED")
    .reduce((sum, sale) => sum + Number(sale.total || 0), 0);

  const filteredProductsForSale = products.filter((product) => {
    const text = `${product.name} ${product.barcode || ""}`.toLowerCase();
    return text.includes(productSearchTerm.toLowerCase());
  });

  const filteredSales = sales.filter((sale) => {
    const text = `${sale.folio || ""} ${sale.userName || ""} ${sale.user?.name || ""
      } ${getPaymentMethodText(sale.paymentMethod)} ${sale.status || ""}`
      .toLowerCase();

    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <MainLayout>
      <div className="sales-page">
        <div className="sales-header">
          <div className="sales-title">
            <h1>Ventas</h1>
            <p>Registro e historial de ventas de la tienda.</p>
          </div>

          <button
            className="btn btn-primary sales-new-btn"
            onClick={handleNewSale}
          >
            <FaPlus className="me-2" />
            Nueva venta
          </button>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="sales-summary-card">
              <div className="sales-summary-body">
                <div className="sales-summary-icon blue">
                  <FaReceipt />
                </div>
                <p className="sales-summary-label">Total ventas</p>
                <h3 className="sales-summary-value">{sales.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="sales-summary-card">
              <div className="sales-summary-body">
                <div className="sales-summary-icon green">
                  <FaCheckCircle />
                </div>
                <p className="sales-summary-label">Ventas activas</p>
                <h3 className="sales-summary-value">{completedSales}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="sales-summary-card">
              <div className="sales-summary-body">
                <div className="sales-summary-icon red">
                  <FaTimesCircle />
                </div>
                <p className="sales-summary-label">Canceladas</p>
                <h3 className="sales-summary-value">{cancelledSales}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="sales-summary-card">
              <div className="sales-summary-body">
                <div className="sales-summary-icon yellow">
                  <FaCashRegister />
                </div>
                <p className="sales-summary-label">Total vendido</p>
                <h3 className="sales-summary-value">
                  {formatCurrency(totalSold)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        {error && <div className="alert alert-danger">{error}</div>}

        {!openRegister && !loading && (
          <div className="alert alert-warning">
            No hay caja abierta. Abre una caja desde el módulo Caja para
            registrar ventas.
          </div>
        )}

        {showForm && (
          <div className="sale-form-modal-container">
            <div className="sale-form-overlay" onClick={handleCancel}></div>

            <div className="sale-form-modal-wrapper">
              <div className="sale-form-modal-content">
                <div className="card sale-form-card sale-form-card-modal">
                  <div className="card-body">
                    <div className="sale-form-header">
                      <div>
                        <h5>Nueva venta</h5>
                        <p>
                          Escanea productos, calcula total, pago recibido y
                          cambio.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="sale-form-close-btn"
                        onClick={handleCancel}
                      >
                        ×
                      </button>
                    </div>

                    {error && (
                      <div className="alert alert-danger sale-modal-alert">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="alert alert-success sale-modal-alert">
                        {success}
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      <div className="row g-4">
                        <div className="col-12 col-lg-8">
                          <div className="sale-block">
                            <h6>Datos de venta</h6>

                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">Usuario</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={user?.name || "Usuario actual"}
                                  disabled
                                />
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Método de pago
                                </label>
                                <select
                                  name="paymentMethod"
                                  className="form-select"
                                  value={formData.paymentMethod}
                                  onChange={handleChange}
                                  required
                                >
                                  <option value="CASH">Efectivo</option>
                                  <option value="CARD">Tarjeta</option>
                                  <option value="TRANSFER">
                                    Transferencia
                                  </option>
                                </select>
                              </div>

                              <div className="col-md-4 mb-3">
                                <label className="form-label">
                                  Monto recibido
                                </label>
                                <input
                                  type="number"
                                  name="amountReceived"
                                  className="form-control"
                                  placeholder="0.00"
                                  value={formData.amountReceived}
                                  onChange={handleChange}
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          <div className="sale-block mt-3">
                            <div className="sale-product-search-header">
                              <div>
                                <h6>Agregar producto</h6>
                                <p>
                                  Escanea el código de barras o busca por nombre.
                                </p>
                              </div>
                            </div>

                            <div className="sale-barcode-box mb-3">
                              <label className="form-label">
                                Escanear código de barras
                              </label>

                              <div className="input-group sale-barcode-input-group">
                                <span className="input-group-text">
                                  <FaReceipt />
                                </span>

                                <input
                                  ref={barcodeInputRef}
                                  type="text"
                                  className="form-control sale-barcode-input"
                                  placeholder="Escanea el código y presiona Enter..."
                                  value={barcodeInput}
                                  onChange={(e) =>
                                    setBarcodeInput(e.target.value)
                                  }
                                  onKeyDown={handleBarcodeKeyDown}
                                />
                              </div>

                              <small className="sale-barcode-help">
                                También puedes escribir el código manualmente y
                                presionar Enter.
                              </small>
                            </div>

                            <div className="sale-product-search">
                              <div className="input-group">
                                <span className="input-group-text">
                                  <FaSearch />
                                </span>

                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Buscar producto por nombre o código..."
                                  value={productSearchTerm}
                                  onChange={(e) =>
                                    setProductSearchTerm(e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            <div className="sale-products-list mt-3">
                              {filteredProductsForSale.length === 0 ? (
                                <div className="sale-empty-products">
                                  No se encontraron productos disponibles.
                                </div>
                              ) : (
                                filteredProductsForSale.map((product) => (
                                  <div
                                    className={
                                      getAvailableStock(product) <= 0
                                        ? "sale-product-item sale-product-item-no-stock"
                                        : "sale-product-item"
                                    }
                                    key={product.id}
                                  >
                                    <div className="sale-product-info">
                                      <strong>{product.name}</strong>
                                      <span>
                                        Código:{" "}
                                        {product.barcode || "Sin código"} |
                                        Stock: {getAvailableStock(product)}
                                      </span>
                                    </div>

                                    <div className="sale-product-price">
                                      {formatCurrency(product.salePrice)}
                                    </div>

                                    <input
                                      type="number"
                                      className="form-control sale-product-qty"
                                      min="1"
                                      max={getAvailableStock(product)}
                                      placeholder="1"
                                      value={
                                        selectedQuantities[product.id] || ""
                                      }
                                      onChange={(e) =>
                                        handleProductQuantityChange(
                                          product.id,
                                          e.target.value
                                        )
                                      }
                                    />

                                    <button
                                      type="button"
                                      className={
                                        getAvailableStock(product) <= 0
                                          ? "btn sale-product-add-btn sale-product-no-stock-btn"
                                          : "btn btn-outline-primary sale-product-add-btn"
                                      }
                                      onClick={() =>
                                        handleAddProductToSale(product)
                                      }
                                      disabled={getAvailableStock(product) <= 0}
                                    >
                                      {getAvailableStock(product) <= 0
                                        ? "Sin stock"
                                        : "Agregar"}
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-lg-4">
                          <div className="sale-total-card">
                            <h6>Resumen de venta</h6>

                            <div className="sale-total-row">
                              <span>Total</span>
                              <strong>{formatCurrency(total)}</strong>
                            </div>

                            <div className="sale-total-row">
                              <span>Monto recibido</span>
                              <strong>
                                {formatCurrency(
                                  Number(formData.amountReceived || 0)
                                )}
                              </strong>
                            </div>

                            <div className="sale-total-row">
                              <span>Cambio</span>
                              <strong
                                className={
                                  change < 0 ? "text-danger" : "text-success"
                                }
                              >
                                {formatCurrency(change)}
                              </strong>
                            </div>

                            <div className="sale-actions mt-4">
                              <button
                                type="submit"
                                className="btn btn-success w-100"
                                disabled={saving}
                              >
                                {saving ? "Guardando..." : "Guardar venta"}
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline-secondary w-100"
                                onClick={handleCancel}
                              >
                                Cancelar
                              </button>
                            </div>

                            {saleItems.length > 0 && (
                              <div className="sale-cart-summary mt-4">
                                <h6>Productos agregados</h6>

                                <div className="sale-cart-items">
                                  {saleItems.map((item) => (
                                    <div
                                      className="sale-cart-item"
                                      key={item.productId}
                                    >
                                      <div>
                                        <strong>{item.productName}</strong>
                                        <span>
                                          {item.quantity} x{" "}
                                          {formatCurrency(item.salePrice)}
                                        </span>
                                      </div>

                                      <div className="sale-cart-item-right">
                                        <strong>
                                          {formatCurrency(item.subtotal)}
                                        </strong>

                                        <button
                                          type="button"
                                          className="sale-cart-remove-btn"
                                          onClick={() =>
                                            handleRemoveItem(item.productId)
                                          }
                                        >
                                          <FaTrash />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && <div className="alert alert-info">Cargando ventas...</div>}

        {!loading && (
          <div className="card sales-card">
            <div className="card-body">
              <div className="sales-toolbar">
                <div>
                  <h5>Historial de ventas</h5>
                  <p>{filteredSales.length} venta(s) encontradas.</p>
                </div>

                <div className="sales-search">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar folio, usuario o estado..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="sales-table-wrapper">
                <table className="table table-hover align-middle sales-table">
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Total</th>
                      <th>Método</th>
                      <th>Estado</th>
                      <th>Usuario</th>
                      <th>Fecha</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSales.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-4">
                          No hay ventas registradas.
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((sale) => (
                        <tr key={sale.id}>
                          <td>
                            <div className="sale-folio">
                              {sale.folio || `VENTA-${sale.id}`}
                            </div>
                            <div className="sale-id">ID: {sale.id}</div>
                          </td>

                          <td className="sale-total">
                            {formatCurrency(sale.total)}
                          </td>

                          <td>{getPaymentMethodText(sale.paymentMethod)}</td>

                          <td>{getStatusBadge(sale.status)}</td>

                          <td>
                            {sale.userName || sale.user?.name || "Sin usuario"}
                          </td>

                          <td>
                            {formatDate(sale.createdAt || sale.saleDate)}
                          </td>

                          <td>
                            <div className="sales-action-buttons">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewDetail(sale.id)}
                              >
                                <FaEye className="me-1" />
                                Ver
                              </button>

                              {sale.status !== "CANCELLED" && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleCancelSale(sale.id)}
                                >
                                  Cancelar
                                </button>
                              )}
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

        {showDetailModal && selectedSale && (
          <>
            <div className="modal fade show d-block" tabIndex="-1">
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content sales-modal">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      Detalle de venta {selectedSale.folio || selectedSale.id}
                    </h5>

                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseDetailModal}
                    ></button>
                  </div>

                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <p>
                          <strong>Folio:</strong>{" "}
                          {selectedSale.folio || `VENTA-${selectedSale.id}`}
                        </p>

                        <p>
                          <strong>Usuario:</strong>{" "}
                          {selectedSale.userName ||
                            selectedSale.user?.name ||
                            "Sin usuario"}
                        </p>

                        <p>
                          <strong>Método de pago:</strong>{" "}
                          {getPaymentMethodText(selectedSale.paymentMethod)}
                        </p>
                      </div>

                      <div className="col-md-6">
                        <p>
                          <strong>Estado:</strong>{" "}
                          {getStatusBadge(selectedSale.status)}
                        </p>

                        <p>
                          <strong>Fecha:</strong>{" "}
                          {formatDate(
                            selectedSale.createdAt || selectedSale.saleDate
                          )}
                        </p>
                      </div>
                    </div>

                    <h6>Productos vendidos</h6>

                    <div className="table-responsive">
                      <table className="table table-sm table-bordered align-middle">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio unitario</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>

                        <tbody>
                          {!selectedSale.details ||
                            selectedSale.details.length === 0 ? (
                            <tr>
                              <td
                                colSpan="4"
                                className="text-center text-muted"
                              >
                                Esta venta no tiene productos.
                              </td>
                            </tr>
                          ) : (
                            selectedSale.details.map((detail) => (
                              <tr key={detail.id}>
                                <td>{detail.productName}</td>
                                <td>{detail.quantity}</td>
                                <td>{formatCurrency(detail.unitPrice)}</td>
                                <td>{formatCurrency(detail.subtotal)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="sale-total-card mt-3">
                      <div className="sale-total-row">
                        <span>Total</span>
                        <strong>{formatCurrency(selectedSale.total)}</strong>
                      </div>

                      <div className="sale-total-row">
                        <span>Monto recibido</span>
                        <strong>
                          {formatCurrency(selectedSale.amountReceived)}
                        </strong>
                      </div>

                      <div className="sale-total-row">
                        <span>Cambio</span>
                        <strong className="text-success">
                          {formatCurrency(selectedSale.changeAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseDetailModal}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-backdrop fade show"></div>
          </>
        )}
      </div>

      {showTicketModal && ticketSale && (
        <>
          <div className="modal fade show d-block ticket-modal-wrapper" tabIndex="-1">
            <div className="modal-dialog modal-sm modal-dialog-centered">
              <div className="modal-content ticket-modal">
                <div className="modal-header no-print">
                  <h5 className="modal-title">Ticket de venta</h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseTicketModal}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="ticket-print-area">
                    <div className="ticket-header">
                      <h4>Tienda</h4>
                      <p>Sistema POS</p>
                      <span>Ticket de venta</span>
                    </div>

                    <div className="ticket-divider"></div>

                    <div className="ticket-info">
                      <div>
                        <span>Folio:</span>
                        <strong>{ticketSale.folio || `VENTA-${ticketSale.id || ""}`}</strong>
                      </div>

                      <div>
                        <span>Fecha:</span>
                        <strong>
                          {formatDate(ticketSale.createdAt || ticketSale.saleDate || new Date())}
                        </strong>
                      </div>

                      <div>
                        <span>Cajero:</span>
                        <strong>{ticketSale.userName || user?.name || "Sin usuario"}</strong>
                      </div>

                      <div>
                        <span>Pago:</span>
                        <strong>{getPaymentMethodText(ticketSale.paymentMethod)}</strong>
                      </div>
                    </div>

                    <div className="ticket-divider"></div>

                    <div className="ticket-products">
                      {(ticketSale.details || []).map((detail, index) => (
                        <div className="ticket-product" key={detail.id || index}>
                          <div className="ticket-product-name">
                            {detail.productName || "Producto"}
                          </div>

                          <div className="ticket-product-row">
                            <span>
                              {detail.quantity} x {formatCurrency(detail.unitPrice)}
                            </span>
                            <strong>{formatCurrency(detail.subtotal)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="ticket-divider"></div>

                    <div className="ticket-totals">
                      <div>
                        <span>Total</span>
                        <strong>{formatCurrency(ticketSale.total)}</strong>
                      </div>

                      <div>
                        <span>Recibido</span>
                        <strong>{formatCurrency(ticketSale.amountReceived)}</strong>
                      </div>

                      <div>
                        <span>Cambio</span>
                        <strong>{formatCurrency(ticketSale.changeAmount)}</strong>
                      </div>
                    </div>

                    <div className="ticket-divider"></div>

                    <div className="ticket-footer">
                      <p>¡Gracias por su compra!</p>
                      <small>Conserve su ticket.</small>
                    </div>
                  </div>
                </div>

                <div className="modal-footer no-print">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseTicketModal}
                  >
                    Cerrar
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePrintTicket}
                  >
                    Imprimir
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show no-print"></div>
        </>
      )}
    </MainLayout>

  );
}

export default Sales;