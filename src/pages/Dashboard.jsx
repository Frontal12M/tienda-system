import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { getDashboardStats } from "../services/dashboardService";
import {
  FaBoxOpen,
  FaCashRegister,
  FaTags,
  FaUsers,
  FaChartLine,
  FaStore,
} from "react-icons/fa";
import "../styles/Dashboard.css";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const routes = {
    categorias: "/categories",
    productos: "/products",
    ventas: "/sales",
    usuarios: "/users",
    inventario: "/inventory",
    reportes: "/reports",
    caja: "/cash-register",
    movimientosCaja: "/cash-movements",
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboardStats();

      console.log("Dashboard data:", data);

      setStats(data.responseObject || data);
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
      setError("No se pudo cargar la información del dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const currentDate = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <MainLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
            <p>Resumen general del sistema de tienda.</p>
          </div>

          <div className="dashboard-date">{currentDate}</div>
        </div>

        {loading && (
          <div className="alert alert-info">Cargando información...</div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && (
          <div className="row g-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <Link to={routes.categorias} className="dashboard-card-link">
                <div className="dashboard-card">
                  <div className="dashboard-card-body">
                    <div className="dashboard-icon blue">
                      <FaTags />
                    </div>

                    <p className="dashboard-card-label">Categorías</p>

                    <h3 className="dashboard-card-value">
                      {stats?.totalCategories ?? 0}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <Link to={routes.productos} className="dashboard-card-link">
                <div className="dashboard-card">
                  <div className="dashboard-card-body">
                    <div className="dashboard-icon green">
                      <FaBoxOpen />
                    </div>

                    <p className="dashboard-card-label">Productos</p>

                    <h3 className="dashboard-card-value">
                      {stats?.totalProducts ?? 0}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <Link to={routes.ventas} className="dashboard-card-link">
                <div className="dashboard-card">
                  <div className="dashboard-card-body">
                    <div className="dashboard-icon yellow">
                      <FaCashRegister />
                    </div>

                    <p className="dashboard-card-label">Ventas</p>

                    <h3 className="dashboard-card-value">
                      {stats?.totalSales ?? 0}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <Link to={routes.usuarios} className="dashboard-card-link">
                <div className="dashboard-card">
                  <div className="dashboard-card-body">
                    <div className="dashboard-icon red">
                      <FaUsers />
                    </div>

                    <p className="dashboard-card-label">Usuarios</p>

                    <h3 className="dashboard-card-value">
                      {stats?.totalUsers ?? 0}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        <div className="row g-4 mt-1">
          <div className="col-12 col-lg-7">
            <div className="card dashboard-section-card">
              <div className="card-body">
                <h5 className="dashboard-section-title">Usuario en sesión</h5>

                <div className="user-info-row">
                  <span className="user-info-label">Nombre</span>
                  <span className="user-info-value">
                    {user?.name || "Sin nombre"}
                  </span>
                </div>

                <div className="user-info-row">
                  <span className="user-info-label">Usuario</span>
                  <span className="user-info-value">
                    {user?.username || "Sin usuario"}
                  </span>
                </div>

                <div className="user-info-row">
                  <span className="user-info-label">Rol</span>
                  <span className="user-info-value">
                    {user?.role || "Sin rol"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card dashboard-section-card">
              <div className="card-body">
                <h5 className="dashboard-section-title">Accesos rápidos</h5>

                <div className="quick-actions">
                  <Link to={routes.ventas} className="quick-action-btn">
                    Registrar venta
                  </Link>

                  <Link to={routes.productos} className="quick-action-btn">
                    Administrar productos
                  </Link>

                  <Link to={routes.inventario} className="quick-action-btn">
                    Ver inventario
                  </Link>

                  <Link to={routes.reportes} className="quick-action-btn">
                    Ver reportes
                  </Link>

                  <Link to={routes.movimientosCaja} className="quick-action-btn">
                    Movimientos de caja
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-12 col-lg-6">
            <div className="card dashboard-section-card">
              <div className="card-body">
                <h5 className="dashboard-section-title">Estado de caja</h5>

                <Link to={routes.caja} className="dashboard-status-link">
                  <div className="dashboard-status-box">
                    <div className="dashboard-status-icon">
                      <FaStore />
                    </div>

                    <div>
                      <p className="dashboard-status-title">Caja del día</p>
                      <p className="dashboard-status-text">
                        Revisa si hay una caja abierta y los movimientos
                        registrados.
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="summary-list">
                  <div className="summary-item">
                    <span>Estado</span>
                    <strong>Pendiente de validar</strong>
                  </div>

                  <div className="summary-item">
                    <span>Ventas registradas</span>
                    <strong>{stats?.totalSales ?? 0}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Módulo</span>
                    <strong>Caja</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card dashboard-section-card">
              <div className="card-body">
                <h5 className="dashboard-section-title">Resumen del sistema</h5>

                <div className="dashboard-status-box">
                  <div className="dashboard-status-icon">
                    <FaChartLine />
                  </div>

                  <div>
                    <p className="dashboard-status-title">Actividad general</p>
                    <p className="dashboard-status-text">
                      Información rápida de los módulos principales de la tienda.
                    </p>
                  </div>
                </div>

                <div className="summary-list">
                  <div className="summary-item">
                    <span>Productos registrados</span>
                    <strong>{stats?.totalProducts ?? 0}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Categorías registradas</span>
                    <strong>{stats?.totalCategories ?? 0}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Usuarios registrados</span>
                    <strong>{stats?.totalUsers ?? 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;