import { NavLink, useNavigate } from "react-router-dom";
import {
  FaBoxOpen,
  FaCashRegister,
  FaChartBar,
  FaHome,
  FaList,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaTags,
  FaUsers,
  FaWarehouse,
} from "react-icons/fa";
import "../styles/MainLayout.css";

function MainLayout({ children }) {
  const navigate = useNavigate();

  const authData = JSON.parse(localStorage.getItem("authData"));
  const user = authData || JSON.parse(localStorage.getItem("user")) || {};
  const userRole = user?.role;

  const canSee = (roles) => {
    return roles.includes(userRole);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">T</div>

          <div>
            <h3>Tienda</h3>
            <span>Sistema POS</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          {canSee(["OWNER", "ADMIN", "CASHIER"]) && (
            <NavLink to="/dashboard">
              <FaHome /> Dashboard
            </NavLink>
          )}

          {canSee(["OWNER", "ADMIN"]) && (
            <NavLink to="/categories">
              <FaTags /> Categorías
            </NavLink>
          )}

          {canSee(["OWNER", "ADMIN", "CASHIER"]) && (
            <NavLink to="/products">
              <FaBoxOpen /> Productos
            </NavLink>
          )}

          {canSee(["OWNER", "ADMIN", "CASHIER"]) && (
            <NavLink to="/sales">
              <FaCashRegister /> Ventas
            </NavLink>
          )}

          {canSee(["OWNER", "ADMIN"]) && (
            <NavLink to="/inventory">
              <FaWarehouse /> Inventario
            </NavLink>
          )}

          {canSee(["OWNER", "ADMIN", "CASHIER"]) && (
            <NavLink to="/cash-register">
              <FaList /> Caja
            </NavLink>
          )}

          {canSee(["OWNER", "ADMIN", "CASHIER"]) && (
            <NavLink to="/cash-movements">
              <FaMoneyBillWave /> Movimientos caja
            </NavLink>
          )}

          {canSee(["OWNER", "ADMIN"]) && (
            <NavLink to="/reports">
              <FaChartBar /> Reportes
            </NavLink>
          )}

          {canSee(["OWNER", "ADMIN"]) && (
            <NavLink to="/users">
              <FaUsers /> Usuarios
            </NavLink>
          )}
        </nav>

        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
          </div>

          <div className="sidebar-user-data">
            <strong>{user?.name || user?.username || "Usuario"}</strong>
            <small>{user?.role || "Sin rol"}</small>
          </div>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt /> Cerrar sesión
        </button>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <h5>Panel administrativo</h5>
            <span>Gestión general de tienda</span>
          </div>

          <div className="user-info">
            <div className="user-avatar">
              {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user?.name || user?.username || "Usuario"}</strong>
              <small>{user?.role || "Sin rol"}</small>
            </div>
          </div>
        </header>

        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}

export default MainLayout;