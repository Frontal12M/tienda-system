import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  getAllUsers,
  createUser,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser,
} from "../services/userService";
import {
  FaCheckCircle,
  FaPlus,
  FaSearch,
  FaTimesCircle,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import "../styles/Users.css";

function Users() {
  const [users, setUsers] = useState([]);

  const initialFormData = {
    name: "",
    username: "",
    email: "",
    password: "",
    role: "ADMIN",
    active: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [editingUserId, setEditingUserId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllUsers();

      console.log("Usuarios:", data);

      setUsers(data.responseObject || data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingUserId(null);
  };

  const handleNewUser = () => {
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
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);

    setFormData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      role: user.role || "ADMIN",
      active: user.active ?? true,
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.name.trim()) {
        setError("El nombre es obligatorio.");
        setSaving(false);
        return;
      }

      if (!formData.username.trim()) {
        setError("El usuario es obligatorio.");
        setSaving(false);
        return;
      }

      if (!formData.email.trim()) {
        setError("El correo es obligatorio.");
        setSaving(false);
        return;
      }

      if (!editingUserId && !formData.password.trim()) {
        setError("La contraseña es obligatoria para crear un usuario.");
        setSaving(false);
        return;
      }

      if (formData.password.trim() && formData.password.trim().length < 6) {
        setError("La contraseña debe tener mínimo 6 caracteres.");
        setSaving(false);
        return;
      }

      const userToSave = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        active: formData.active,
      };

      if (formData.password.trim()) {
        userToSave.password = formData.password;
      }

      let data;

      if (editingUserId) {
        data = await updateUser(editingUserId, userToSave);
        setSuccess(data.responseString || "Usuario actualizado correctamente.");
      } else {
        data = await createUser(userToSave);
        setSuccess(data.responseString || "Usuario creado correctamente.");
      }

      resetForm();
      setShowForm(false);
      await loadUsers();
    } catch (error) {
      console.error("Error al guardar usuario:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo guardar el usuario.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      setError("");
      setSuccess("");

      const data = await activateUser(id);

      setSuccess(data.responseString || "Usuario activado correctamente.");
      await loadUsers();
    } catch (error) {
      console.error("Error al activar usuario:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo activar el usuario.";

      setError(message);
    }
  };

  const handleDeactivate = async (id) => {
    const confirmDeactivate = window.confirm(
      "¿Seguro que deseas desactivar este usuario?"
    );

    if (!confirmDeactivate) return;

    try {
      setError("");
      setSuccess("");

      const data = await deactivateUser(id);

      setSuccess(data.responseString || "Usuario desactivado correctamente.");
      await loadUsers();
    } catch (error) {
      console.error("Error al desactivar usuario:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo desactivar el usuario.";

      setError(message);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer."
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setSuccess("");

      const data = await deleteUser(id);

      setSuccess(data.responseString || "Usuario eliminado correctamente.");
      await loadUsers();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo eliminar el usuario.";

      setError(message);
    }
  };

  const getStatusBadge = (active) => {
    if (active) {
      return <span className="user-status-badge active">Activo</span>;
    }

    return <span className="user-status-badge inactive">Inactivo</span>;
  };

  const getRoleBadge = (role) => {
    if (role === "ADMIN") {
      return <span className="user-role-badge admin">ADMIN</span>;
    }

    if (role === "CASHIER") {
      return <span className="user-role-badge cashier">CAJERO</span>;
    }

    if (role === "EMPLOYEE") {
      return <span className="user-role-badge employee">EMPLEADO</span>;
    }

    return <span className="user-role-badge default">{role || "Sin rol"}</span>;
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

  const totalUsers = users.length;

  const activeUsers = users.filter((user) => user.active).length;

  const inactiveUsers = users.filter((user) => !user.active).length;

  const adminUsers = users.filter((user) => user.role === "ADMIN").length;

  const filteredUsers = users.filter((user) => {
    const text = `${user.id} ${user.name || ""} ${user.username || ""} ${
      user.email || ""
    } ${user.role || ""} ${user.active ? "activo" : "inactivo"}`.toLowerCase();

    const matchesSearch = text.includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && user.active) ||
      (statusFilter === "INACTIVE" && !user.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <MainLayout>
      <div className="users-page">
        <div className="users-header">
          <div className="users-title">
            <h1>Usuarios</h1>
            <p>Administración de usuarios del sistema POS.</p>
          </div>

          <button className="btn btn-primary users-new-btn" onClick={handleNewUser}>
            <FaPlus className="me-2" />
            Nuevo usuario
          </button>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="users-summary-card">
              <div className="users-summary-body">
                <div className="users-summary-icon blue">
                  <FaUsers />
                </div>
                <p className="users-summary-label">Total usuarios</p>
                <h3 className="users-summary-value">{totalUsers}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="users-summary-card">
              <div className="users-summary-body">
                <div className="users-summary-icon green">
                  <FaCheckCircle />
                </div>
                <p className="users-summary-label">Usuarios activos</p>
                <h3 className="users-summary-value">{activeUsers}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="users-summary-card">
              <div className="users-summary-body">
                <div className="users-summary-icon red">
                  <FaTimesCircle />
                </div>
                <p className="users-summary-label">Usuarios inactivos</p>
                <h3 className="users-summary-value">{inactiveUsers}</h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="users-summary-card">
              <div className="users-summary-body">
                <div className="users-summary-icon yellow">
                  <FaUserShield />
                </div>
                <p className="users-summary-label">Administradores</p>
                <h3 className="users-summary-value">{adminUsers}</h3>
              </div>
            </div>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        {error && <div className="alert alert-danger">{error}</div>}

        {showForm && (
          <div className="card users-form-card mb-4">
            <div className="card-body">
              <h5>{editingUserId ? "Editar usuario" : "Nuevo usuario"}</h5>
              <p>
                {editingUserId
                  ? "Actualiza la información del usuario."
                  : "Registra un nuevo usuario para acceder al sistema."}
              </p>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Nombre completo"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Usuario</label>
                    <input
                      type="text"
                      name="username"
                      className="form-control"
                      placeholder="usuario"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Correo</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Contraseña{" "}
                      {editingUserId && (
                        <span className="text-muted">
                          (dejar vacío para no cambiar)
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder={
                        editingUserId
                          ? "Nueva contraseña opcional"
                          : "Mínimo 6 caracteres"
                      }
                      value={formData.password}
                      onChange={handleChange}
                      required={!editingUserId}
                      minLength={6}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Rol</label>
                    <select
                      name="role"
                      className="form-select"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="ADMIN">Administrador</option>
                      <option value="CASHIER">Cajero</option>
                      <option value="EMPLOYEE">Empleado</option>
                    </select>
                  </div>

                  <div className="col-md-4 mb-3 d-flex align-items-end">
                    <div className="form-check users-check">
                      <input
                        type="checkbox"
                        name="active"
                        className="form-check-input"
                        checked={formData.active}
                        onChange={handleChange}
                        id="activeCheck"
                      />
                      <label className="form-check-label" htmlFor="activeCheck">
                        Usuario activo
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
                      : editingUserId
                      ? "Actualizar usuario"
                      : "Guardar usuario"}
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

        {loading && <div className="alert alert-info">Cargando usuarios...</div>}

        {!loading && (
          <div className="card users-card">
            <div className="card-body">
              <div className="users-toolbar">
                <div>
                  <h5>Listado de usuarios</h5>
                  <p>{filteredUsers.length} usuario(s) encontrados.</p>
                </div>

                <div className="users-search">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar usuario, correo o rol..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="users-filters">
                <select
                  className="form-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">Todos los roles</option>
                  <option value="ADMIN">Administradores</option>
                  <option value="CASHIER">Cajeros</option>
                  <option value="EMPLOYEE">Empleados</option>
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

                <button
                  type="button"
                  className="btn btn-outline-secondary users-clear-btn"
                  onClick={clearFilters}
                >
                  Limpiar
                </button>
              </div>

              <div className="users-table-wrapper">
                <table className="table table-hover align-middle users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Fecha creación</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No hay usuarios registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <strong>#{user.id}</strong>
                          </td>

                          <td>
                            <div className="user-name">{user.name}</div>
                          </td>

                          <td>{user.username}</td>

                          <td>{user.email}</td>

                          <td>{getRoleBadge(user.role)}</td>

                          <td>{getStatusBadge(user.active)}</td>

                          <td>{formatDate(user.createdAt)}</td>

                          <td>
                            <div className="users-action-buttons">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(user)}
                              >
                                Editar
                              </button>

                              {user.active ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => handleDeactivate(user.id)}
                                >
                                  Desactivar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => handleActivate(user.id)}
                                >
                                  Activar
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(user.id)}
                              >
                                Eliminar
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

export default Users;