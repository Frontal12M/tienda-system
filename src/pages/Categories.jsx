import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  changeCategoryStatus,
} from "../services/categoriesService";
import {
  FaCheckCircle,
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";
import "../styles/Categories.css";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    active: true,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllCategories();

      console.log("Categories data:", data);

      setCategories(data.responseObject || data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      setError("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      active: true,
    });
    setEditingCategory(null);
  };

  const handleNewCategory = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        setSuccess("Categoría actualizada correctamente.");
      } else {
        await createCategory(formData);
        setSuccess("Categoría registrada correctamente.");
      }

      resetForm();
      setShowForm(false);
      loadCategories();
    } catch (error) {
      console.error("Error al guardar categoría:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo guardar la categoría.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);

    setFormData({
      name: category.name,
      active: category.active,
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleChangeStatus = async (category) => {
    const confirmChange = window.confirm(
      `¿Seguro que deseas cambiar el estado de la categoría "${category.name}"?`
    );

    if (!confirmChange) return;

    try {
      setError("");
      setSuccess("");

      await changeCategoryStatus(category.id);

      setSuccess("Estado de categoría actualizado correctamente.");
      loadCategories();
    } catch (error) {
      console.error("Error al cambiar estado:", error);

      const message =
        error.response?.data?.responseString ||
        error.response?.data?.message ||
        "No se pudo cambiar el estado de la categoría.";

      setError(message);
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

  const getStatusBadge = (active) => {
    if (active) {
      return <span className="category-status-badge active">Activa</span>;
    }

    return <span className="category-status-badge inactive">Inactiva</span>;
  };

  const activeCategories = categories.filter((category) => category.active).length;

  const inactiveCategories = categories.filter(
    (category) => !category.active
  ).length;

  const filteredCategories = categories.filter((category) => {
    const text = `${category.id} ${category.name} ${
      category.active ? "activa" : "inactiva"
    }`.toLowerCase();

    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <MainLayout>
      <div className="categories-page">
        <div className="categories-header">
          <div className="categories-title">
            <h1>Categorías</h1>
            <p>Gestión de categorías de productos.</p>
          </div>

          <button
            className="btn btn-primary categories-new-btn"
            onClick={handleNewCategory}
          >
            <FaPlus className="me-2" />
            Nueva categoría
          </button>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="categories-summary-card">
              <div className="categories-summary-body">
                <div className="categories-summary-icon blue">
                  <FaLayerGroup />
                </div>
                <p className="categories-summary-label">Total categorías</p>
                <h3 className="categories-summary-value">
                  {categories.length}
                </h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-4">
            <div className="categories-summary-card">
              <div className="categories-summary-body">
                <div className="categories-summary-icon green">
                  <FaCheckCircle />
                </div>
                <p className="categories-summary-label">Categorías activas</p>
                <h3 className="categories-summary-value">
                  {activeCategories}
                </h3>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-4">
            <div className="categories-summary-card">
              <div className="categories-summary-body">
                <div className="categories-summary-icon red">
                  <FaTimesCircle />
                </div>
                <p className="categories-summary-label">Categorías inactivas</p>
                <h3 className="categories-summary-value">
                  {inactiveCategories}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        {error && <div className="alert alert-danger">{error}</div>}

        {showForm && (
          <div className="card category-form-card mb-4">
            <div className="card-body">
              <h5>{editingCategory ? "Editar categoría" : "Nueva categoría"}</h5>
              <p>
                {editingCategory
                  ? "Actualiza la información de la categoría."
                  : "Registra una nueva categoría para organizar tus productos."}
              </p>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label className="form-label">Nombre de la categoría</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Ejemplo: Bebidas"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3 d-flex align-items-end">
                    <div className="form-check category-check">
                      <input
                        type="checkbox"
                        name="active"
                        className="form-check-input"
                        checked={formData.active}
                        onChange={handleChange}
                        id="active"
                      />
                      <label className="form-check-label" htmlFor="active">
                        Categoría activa
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
                      : editingCategory
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
          <div className="alert alert-info">Cargando categorías...</div>
        )}

        {!loading && (
          <div className="card categories-card">
            <div className="card-body">
              <div className="categories-toolbar">
                <div>
                  <h5>Listado de categorías</h5>
                  <p>{filteredCategories.length} categoría(s) encontradas.</p>
                </div>

                <div className="categories-search">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar categoría..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="categories-table-wrapper">
                <table className="table table-hover align-middle categories-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Estado</th>
                      <th>Fecha creación</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          No hay categorías registradas.
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((category) => (
                        <tr key={category.id}>
                          <td>
                            <strong>#{category.id}</strong>
                          </td>

                          <td>
                            <div className="category-name">{category.name}</div>
                          </td>

                          <td>{getStatusBadge(category.active)}</td>

                          <td>{formatDate(category.createdAt)}</td>

                          <td>
                            <div className="categories-action-buttons">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(category)}
                              >
                                Editar
                              </button>

                              <button
                                className={
                                  category.active
                                    ? "btn btn-sm btn-outline-danger"
                                    : "btn btn-sm btn-outline-success"
                                }
                                onClick={() => handleChangeStatus(category)}
                              >
                                {category.active ? "Desactivar" : "Activar"}
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

export default Categories;