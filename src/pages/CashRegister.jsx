import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  openCashRegister,
  getAllCashRegisters,
  getOpenCashRegister,
  closeCashRegister,
} from "../services/cashRegisterService";
import {
  FaCashRegister,
  FaCheckCircle,
  FaLock,
  FaMoneyBillWave,
  FaPlus,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";
import "../styles/CashRegister.css";

function CashRegister() {
  const [cashRegisters, setCashRegisters] = useState([]);
  const [openRegister, setOpenRegister] = useState(null);

  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");

  const [showOpenForm, setShowOpenForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const authData = JSON.parse(localStorage.getItem("authData")) || {};
  const user = authData || JSON.parse(localStorage.getItem("user")) || {};
  const userRole = user?.role;

  const isCashier = userRole === "CASHIER";

  const loadCashRegisters = async () => {
    try {
      if (isCashier) {
        setCashRegisters([]);
        return;
      }

      const data = await getAllCashRegisters();
      setCashRegisters(data.responseObject || data);
    } catch (error) {
      console.error("Error al cargar cajas:", error);

      if (!isCashier) {
        setError("No se pudieron cargar las cajas.");
      }

      setCashRegisters([]);
    }
  };

  const loadOpenCashRegister = async () => {
    try {
      const data = await getOpenCashRegister();

      if (!data.responseBoolean || !data.responseObject) {
        setOpenRegister(null);
        return;
      }

      setOpenRegister(data.responseObject);
    } catch (error) {
      console.error("Error al cargar caja abierta:", error);
      setOpenRegister(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await loadOpenCashRegister();
      await loadCashRegisters();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    if (status === "OPEN") {
      return <span className="cash-status-badge open">Abierta</span>;
    }

    if (status === "CLOSED") {
      return <span className="cash-status-badge closed">Cerrada</span>;
    }

    return (
      <span className="cash-status-badge default">
        {status || "Sin estado"}
      </span>
    );
  };

  const handleShowOpenForm = () => {
    setOpeningAmount("");
    setShowOpenForm(true);
    setShowCloseForm(false);
    setError("");
    setSuccess("");
  };

  const handleCancelOpen = () => {
    setOpeningAmount("");
    setShowOpenForm(false);
    setError("");
  };

  const handleOpenCashRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!openingAmount || Number(openingAmount) < 0) {
        setError("El monto inicial debe ser mayor o igual a 0.");
        setSaving(false);
        return;
      }

      const request = {
        userId: user?.id || 1,
        openingAmount: Number(openingAmount),
      };

      const data = await openCashRegister(request);

      setSuccess(data.responseString || "Caja abierta correctamente.");
      setOpeningAmount("");
      setShowOpenForm(false);

      await loadData();
    } catch (error) {
      console.error("Error al abrir caja:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo abrir la caja.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleShowCloseForm = () => {
    const expectedAmount = Number(openRegister?.expectedAmount || 0).toFixed(2);

    setClosingAmount(expectedAmount);
    setShowCloseForm(true);
    setShowOpenForm(false);
    setError("");
    setSuccess("");
  };

  const handleCancelClose = () => {
    setClosingAmount("");
    setShowCloseForm(false);
    setError("");
  };

  const handleCloseCashRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!openRegister) {
        setError("No hay una caja abierta para cerrar.");
        setSaving(false);
        return;
      }

      if (!closingAmount || Number(closingAmount) < 0) {
        setError("El monto final debe ser mayor o igual a 0.");
        setSaving(false);
        return;
      }

      const request = {
        userId: user?.id || 1,
        closingAmount: Number(closingAmount),
      };

      const data = await closeCashRegister(openRegister.id, request);

      setSuccess(data.responseString || "Caja cerrada correctamente.");
      setClosingAmount("");
      setShowCloseForm(false);

      await loadData();
    } catch (error) {
      console.error("Error al cerrar caja:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo cerrar la caja.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const totalRegisters = cashRegisters.length;

  const totalExpected = cashRegisters.reduce(
    (sum, cashRegister) => sum + Number(cashRegister.expectedAmount || 0),
    0
  );

  const totalDifferences = cashRegisters.reduce(
    (sum, cashRegister) => sum + Number(cashRegister.difference || 0),
    0
  );

  const filteredCashRegisters = cashRegisters.filter((cashRegister) => {
    const text = `${cashRegister.id} ${cashRegister.status || ""} ${
      cashRegister.openedByName || ""
    } ${cashRegister.closedByName || ""}`.toLowerCase();

    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <MainLayout>
      <div className="cash-page">
        <div className="cash-header">
          <div className="cash-title">
            <h1>Caja</h1>
            <p>
              {isCashier
                ? "Control de apertura y cierre de la caja actual."
                : "Control de apertura, cierre e historial de caja."}
            </p>
          </div>

          <div className="cash-header-actions">
            {!openRegister && (
              <button
                className="btn btn-primary cash-action-btn"
                onClick={handleShowOpenForm}
              >
                <FaPlus className="me-2" />
                Abrir caja
              </button>
            )}

            {openRegister && (
              <button
                className="btn btn-danger cash-action-btn"
                onClick={handleShowCloseForm}
              >
                <FaLock className="me-2" />
                Cerrar caja
              </button>
            )}
          </div>
        </div>

        <div className="row g-4 mb-4">
          {!isCashier && (
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="cash-summary-card">
                <div className="cash-summary-body">
                  <div className="cash-summary-icon blue">
                    <FaCashRegister />
                  </div>
                  <p className="cash-summary-label">Total cajas</p>
                  <h3 className="cash-summary-value">{totalRegisters}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="cash-summary-card">
              <div className="cash-summary-body">
                <div
                  className={
                    openRegister
                      ? "cash-summary-icon green"
                      : "cash-summary-icon red"
                  }
                >
                  {openRegister ? <FaCheckCircle /> : <FaTimesCircle />}
                </div>
                <p className="cash-summary-label">Estado actual</p>
                <h3 className="cash-summary-value">
                  {openRegister ? "Abierta" : "Cerrada"}
                </h3>
              </div>
            </div>
          </div>

          {openRegister && isCashier && (
            <>
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="cash-summary-card">
                  <div className="cash-summary-body">
                    <div className="cash-summary-icon yellow">
                      <FaMoneyBillWave />
                    </div>
                    <p className="cash-summary-label">Monto inicial</p>
                    <h3 className="cash-summary-value">
                      {formatCurrency(openRegister.openingAmount)}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="cash-summary-card">
                  <div className="cash-summary-body">
                    <div className="cash-summary-icon blue">
                      <FaMoneyBillWave />
                    </div>
                    <p className="cash-summary-label">Monto esperado</p>
                    <h3 className="cash-summary-value">
                      {formatCurrency(openRegister.expectedAmount)}
                    </h3>
                  </div>
                </div>
              </div>
            </>
          )}

          {!isCashier && (
            <>
              <div className="col-12 col-sm-6 col-lg-3">
                <div className="cash-summary-card">
                  <div className="cash-summary-body">
                    <div className="cash-summary-icon yellow">
                      <FaMoneyBillWave />
                    </div>
                    <p className="cash-summary-label">Esperado histórico</p>
                    <h3 className="cash-summary-value">
                      {formatCurrency(totalExpected)}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-3">
                <div className="cash-summary-card">
                  <div className="cash-summary-body">
                    <div className="cash-summary-icon red">
                      <FaMoneyBillWave />
                    </div>
                    <p className="cash-summary-label">Diferencia total</p>
                    <h3 className="cash-summary-value">
                      {formatCurrency(totalDifferences)}
                    </h3>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        {error && <div className="alert alert-danger">{error}</div>}

        {loading && <div className="alert alert-info">Cargando caja...</div>}

        {!loading && (
          <>
            <div className="card cash-current-card mb-4">
              <div className="card-body">
                <div className="cash-section-header">
                  <div>
                    <h5>Caja actual</h5>
                    <p>Información de la caja abierta en este momento.</p>
                  </div>
                </div>

                {openRegister ? (
                  <>
                    <div className="cash-current-status">
                      <div className="cash-current-icon">
                        <FaCashRegister />
                      </div>

                      <div>
                        <h5>Caja abierta</h5>
                        <p>
                          Abierta por{" "}
                          {openRegister.openedByName || "Sin usuario"} el{" "}
                          {formatDate(openRegister.openedAt)}.
                        </p>
                      </div>
                    </div>

                    <div className="row g-4 mt-1">
                      <div className="col-12 col-md-3">
                        <div className="cash-info-box">
                          <span>Estado</span>
                          <strong>{getStatusBadge(openRegister.status)}</strong>
                        </div>
                      </div>

                      <div className="col-12 col-md-3">
                        <div className="cash-info-box">
                          <span>Monto inicial</span>
                          <strong>
                            {formatCurrency(openRegister.openingAmount)}
                          </strong>
                        </div>
                      </div>

                      <div className="col-12 col-md-3">
                        <div className="cash-info-box">
                          <span>Monto esperado</span>
                          <strong>
                            {formatCurrency(openRegister.expectedAmount)}
                          </strong>
                        </div>
                      </div>

                      <div className="col-12 col-md-3">
                        <div className="cash-info-box">
                          <span>Abierta por</span>
                          <strong>
                            {openRegister.openedByName || "Sin usuario"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="cash-empty-state">
                    <div className="cash-empty-icon">
                      <FaLock />
                    </div>
                    <h5>No hay una caja abierta</h5>
                    <p>
                      Para registrar operaciones de caja, primero abre una caja.
                    </p>
                    <button
                      className="btn btn-primary cash-action-btn"
                      onClick={handleShowOpenForm}
                    >
                      Abrir caja
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showOpenForm && (
              <div className="card cash-form-card mb-4">
                <div className="card-body">
                  <h5>Abrir caja</h5>
                  <p>Ingresa el monto inicial con el que comenzará la caja.</p>

                  <form onSubmit={handleOpenCashRegister}>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Monto inicial</label>
                        <input
                          type="number"
                          className="form-control"
                          value={openingAmount}
                          onChange={(e) => setOpeningAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={saving}
                      >
                        {saving ? "Abriendo..." : "Abrir caja"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancelOpen}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showCloseForm && openRegister && (
              <div className="card cash-form-card mb-4">
                <div className="card-body">
                  <h5>Cerrar caja</h5>
                  <p>
                    Ingresa el monto real contado para calcular la diferencia.
                  </p>

                  <div className="cash-close-info">
                    <span>Monto esperado</span>
                    <strong>{formatCurrency(openRegister.expectedAmount)}</strong>
                  </div>

                  <form onSubmit={handleCloseCashRegister}>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">
                          Monto final contado
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={closingAmount}
                          onChange={(e) => setClosingAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          required
                        />

                        <button
                          type="button"
                          className="btn btn-outline-primary mt-2"
                          onClick={() =>
                            setClosingAmount(
                              Number(openRegister?.expectedAmount || 0).toFixed(
                                2
                              )
                            )
                          }
                        >
                          Usar monto esperado
                        </button>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-danger"
                        disabled={saving}
                      >
                        {saving ? "Cerrando..." : "Cerrar caja"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancelClose}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {!isCashier && (
              <div className="card cash-history-card">
                <div className="card-body">
                  <div className="cash-toolbar">
                    <div>
                      <h5>Historial de cajas</h5>
                      <p>
                        {filteredCashRegisters.length} registro(s) encontrados.
                      </p>
                    </div>

                    <div className="cash-search">
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaSearch />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Buscar por usuario, estado o ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="cash-table-wrapper">
                    <table className="table table-hover align-middle cash-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Estado</th>
                          <th>Monto inicial</th>
                          <th>Monto esperado</th>
                          <th>Monto cierre</th>
                          <th>Diferencia</th>
                          <th>Abrió</th>
                          <th>Cerró</th>
                          <th>Fecha apertura</th>
                          <th>Fecha cierre</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredCashRegisters.length === 0 ? (
                          <tr>
                            <td
                              colSpan="10"
                              className="text-center text-muted py-4"
                            >
                              No hay registros de caja.
                            </td>
                          </tr>
                        ) : (
                          filteredCashRegisters.map((cashRegister) => (
                            <tr key={cashRegister.id}>
                              <td>
                                <strong>#{cashRegister.id}</strong>
                              </td>

                              <td>{getStatusBadge(cashRegister.status)}</td>

                              <td>
                                {formatCurrency(cashRegister.openingAmount)}
                              </td>

                              <td>
                                {formatCurrency(cashRegister.expectedAmount)}
                              </td>

                              <td>
                                {formatCurrency(cashRegister.closingAmount)}
                              </td>

                              <td>
                                <span
                                  className={
                                    Number(cashRegister.difference || 0) === 0
                                      ? "cash-difference-ok"
                                      : "cash-difference-bad"
                                  }
                                >
                                  {formatCurrency(cashRegister.difference)}
                                </span>
                              </td>

                              <td>
                                {cashRegister.openedByName || "Sin usuario"}
                              </td>

                              <td>
                                {cashRegister.closedByName || "Sin usuario"}
                              </td>

                              <td>{formatDate(cashRegister.openedAt)}</td>

                              <td>{formatDate(cashRegister.closedAt)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default CashRegister;