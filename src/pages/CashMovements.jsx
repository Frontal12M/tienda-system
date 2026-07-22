import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  createCashMovement,
  getAllCashMovements,
  getCashMovementsByCashRegister,
} from "../services/cashMovementService";
import { getOpenCashRegister } from "../services/cashRegisterService";
import {
  FaArrowDown,
  FaArrowUp,
  FaCashRegister,
  FaExchangeAlt,
  FaPlus,
  FaSearch,
  FaWallet,
} from "react-icons/fa";
import "../styles/CashMovements.css";

function CashMovements() {
  const [movements, setMovements] = useState([]);
  const [openRegister, setOpenRegister] = useState(null);

  const initialFormData = {
    type: "INCOME",
    description: "",
    amount: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const authData = JSON.parse(localStorage.getItem("authData")) || {};
  const user = authData || JSON.parse(localStorage.getItem("user")) || {};
  const userRole = user?.role;

  const loadOpenRegister = async () => {
    try {
      const data = await getOpenCashRegister();

      if (!data.responseBoolean || !data.responseObject) {
        setOpenRegister(null);
        return null;
      }

      setOpenRegister(data.responseObject);
      return data.responseObject;
    } catch (error) {
      console.warn("No hay caja abierta:", error);
      setOpenRegister(null);
      return null;
    }
  };

  const loadMovements = async (cashRegister) => {
    try {
      setError("");

      if (userRole === "CASHIER") {
        if (!cashRegister?.id) {
          setMovements([]);
          return;
        }

        const data = await getCashMovementsByCashRegister(cashRegister.id);
        setMovements(data.responseObject || data);
        return;
      }

      const data = await getAllCashMovements();
      setMovements(data.responseObject || data);
    } catch (error) {
      console.error("Error al cargar movimientos de caja:", error);
      setMovements([]);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudieron cargar los movimientos de caja.";

      setError(message);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const cashRegister = await loadOpenRegister();
      await loadMovements(cashRegister);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleShowForm = () => {
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

  const getMovementTypeBadge = (type) => {
    if (type === "INCOME") {
      return <span className="movement-type-badge income">Entrada</span>;
    }

    if (type === "EXPENSE") {
      return <span className="movement-type-badge expense">Salida</span>;
    }

    if (type === "SALE") {
      return <span className="movement-type-badge sale">Venta</span>;
    }

    if (type === "REFUND") {
      return <span className="movement-type-badge refund">Devolución</span>;
    }

    return <span className="movement-type-badge default">{type || "Sin tipo"}</span>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!openRegister) {
        setError("No hay una caja abierta. Primero abre una caja.");
        setSaving(false);
        return;
      }

      if (!formData.description.trim()) {
        setError("La descripción es obligatoria.");
        setSaving(false);
        return;
      }

      if (!formData.amount || Number(formData.amount) <= 0) {
        setError("El monto debe ser mayor a 0.");
        setSaving(false);
        return;
      }

      const cashMovementToSave = {
        type: formData.type,
        description: formData.description,
        amount: Number(formData.amount),
        cashRegister: {
          id: openRegister.id,
        },
        user: {
          id: user?.id || 1,
        },
      };

      console.log("Movimiento de caja a guardar:", cashMovementToSave);

      const data = await createCashMovement(cashMovementToSave);

      setSuccess(
        data.responseString || "Movimiento de caja registrado correctamente."
      );

      resetForm();
      setShowForm(false);

      await loadData();
    } catch (error) {
      console.error("Error al registrar movimiento de caja:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo registrar el movimiento de caja.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const totalIncome = movements
    .filter((movement) => movement.type === "INCOME")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);

  const totalExpense = movements
    .filter((movement) => movement.type === "EXPENSE")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  const filteredMovements = movements.filter((movement) => {
    const text = `${movement.id} ${movement.type || ""} ${movement.description || ""
      } ${movement.userName || ""} ${movement.saleFolio || ""}`.toLowerCase();

    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <MainLayout>
      <div className="movements-page">
        <div className="movements-header">
          <div className="movements-title">
            <h1>Movimientos de caja</h1>
            <p>
              {userRole === "CASHIER"
                ? "Registro de entradas y salidas de la caja actual."
                : "Registro de entradas y salidas manuales de efectivo."}
            </p>
          </div>

          <button
            className="btn btn-primary movements-new-btn"
            onClick={handleShowForm}
            disabled={!openRegister}
          >
            <FaPlus className="me-2" />
            Nuevo movimiento
          </button>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="movements-summary-card">
              <div className="movements-summary-body">
                <div className="movements-summary-icon blue">
                  <FaExchangeAlt />
                </div>
                <p className="movements-summary-label">Movimientos</p>
                <h3 className="movements-summary-value">{movements.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="movements-summary-card">
              <div className="movements-summary-body">
                <div className="movements-summary-icon green">
                  <FaArrowUp />
                </div>
                <p className="movements-summary-label">Entradas</p>
                <h3 className="movements-summary-value">
                  {formatCurrency(totalIncome)}
                </h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="movements-summary-card">
              <div className="movements-summary-body">
                <div className="movements-summary-icon red">
                  <FaArrowDown />
                </div>
                <p className="movements-summary-label">Salidas</p>
                <h3 className="movements-summary-value">
                  {formatCurrency(totalExpense)}
                </h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="movements-summary-card">
              <div className="movements-summary-body">
                <div className="movements-summary-icon yellow">
                  <FaWallet />
                </div>
                <p className="movements-summary-label">Balance</p>
                <h3 className="movements-summary-value">
                  {formatCurrency(balance)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        {error && <div className="alert alert-danger">{error}</div>}

        {loading && (
          <div className="alert alert-info">Cargando movimientos...</div>
        )}

        {!loading && !openRegister && (
          <div className="movement-warning-card">
            <div className="movement-warning-icon">
              <FaCashRegister />
            </div>

            <div>
              <h5>No hay caja abierta</h5>
              <p>
                Para registrar movimientos primero debes abrir una caja desde el
                módulo Caja.
              </p>
            </div>
          </div>
        )}

        {!loading && openRegister && (
          <div className="card movements-current-card mb-4">
            <div className="card-body">
              <div className="movements-section-header">
                <div>
                  <h5>Caja abierta actual</h5>
                  <p>Los nuevos movimientos se registrarán en esta caja.</p>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-12 col-md-3">
                  <div className="movement-info-box">
                    <span>Caja</span>
                    <strong>#{openRegister.id}</strong>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div className="movement-info-box">
                    <span>Monto inicial</span>
                    <strong>{formatCurrency(openRegister.openingAmount)}</strong>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div className="movement-info-box">
                    <span>Monto esperado</span>
                    <strong>{formatCurrency(openRegister.expectedAmount)}</strong>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div className="movement-info-box">
                    <span>Abierta por</span>
                    <strong>{openRegister.openedByName || "Sin usuario"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm && openRegister && (
          <div className="card movements-form-card mb-4">
            <div className="card-body">
              <h5>Nuevo movimiento</h5>
              <p>Registra una entrada o salida manual de efectivo.</p>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Tipo de movimiento</label>
                    <select
                      name="type"
                      className="form-select"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="INCOME">Entrada</option>
                      <option value="EXPENSE">Salida</option>
                    </select>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Monto</label>
                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Usuario</label>
                    <input
                      type="text"
                      className="form-control"
                      value={user?.name || "Usuario actual"}
                      disabled
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="3"
                    placeholder="Ejemplo: Pago a proveedor, retiro de efectivo, cambio extra..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                  ></textarea>
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

        {!loading && (
          <div className="card movements-history-card">
            <div className="card-body">
              <div className="movements-toolbar">
                <div>
                  <h5>
                    {userRole === "CASHIER"
                      ? "Movimientos de la caja actual"
                      : "Historial de movimientos"}
                  </h5>
                  <p>{filteredMovements.length} movimiento(s) encontrados.</p>
                </div>

                <div className="movements-search">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por descripción, usuario o tipo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="movements-table-wrapper">
                <table className="table table-hover align-middle movements-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Monto</th>
                      <th>Caja</th>
                      <th>Usuario</th>
                      <th>Venta</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No hay movimientos registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map((movement) => (
                        <tr key={movement.id}>
                          <td>
                            <strong>#{movement.id}</strong>
                          </td>

                          <td>{getMovementTypeBadge(movement.type)}</td>

                          <td>
                            <div className="movement-description">
                              {movement.description || "Sin descripción"}
                            </div>
                          </td>

                          <td>
                            <span
                              className={
                                movement.type === "EXPENSE"
                                  ? "movement-amount expense"
                                  : "movement-amount income"
                              }
                            >
                              {movement.type === "EXPENSE" ? "-" : "+"}
                              {formatCurrency(movement.amount)}
                            </span>
                          </td>

                          <td>
                            {movement.cashRegisterId
                              ? `Caja #${movement.cashRegisterId}`
                              : "Sin caja"}
                          </td>

                          <td>{movement.userName || "Sin usuario"}</td>

                          <td>
                            {movement.saleFolio
                              ? movement.saleFolio
                              : movement.saleId
                                ? `Venta #${movement.saleId}`
                                : "No aplica"}
                          </td>

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

export default CashMovements;