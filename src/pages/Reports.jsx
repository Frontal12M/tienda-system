import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getDashboardReport } from "../services/reportService";
import { getAllSales, getSaleById } from "../services/salesService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  FaBoxes,
  FaCashRegister,
  FaChartLine,
  FaExchangeAlt,
  FaFileExcel,
  FaFilePdf,
  FaRedo,
  FaShoppingCart,
  FaTags,
  FaUsers,
} from "react-icons/fa";
import "../styles/Reports.css";

function Reports() {
  const [report, setReport] = useState({});
  const [sales, setSales] = useState([]);

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const reportData = await getDashboardReport();
      const salesData = await getAllSales();

      console.log("Reporte dashboard:", reportData);
      console.log("Ventas:", salesData);

      setReport(reportData.responseObject || reportData);
      setSales(salesData.responseObject || salesData);
    } catch (error) {
      console.error("Error al cargar reportes:", error);
      setError("No se pudo cargar la información de reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
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

  const formatOnlyTime = (date) => {
    if (!date) return "Sin hora";

    return new Date(date).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSelectedDateString = () => {
    const [year, month, day] = selectedDate.split("-");
    return `${day}/${month}/${year}`;
  };

  const getSelectedDateFileName = () => {
    const [year, month, day] = selectedDate.split("-");
    return `${day}-${month}-${year}`;
  };

  const isSelectedDate = (date) => {
    if (!date) return false;

    const saleDate = new Date(date);
    const [year, month, day] = selectedDate.split("-").map(Number);

    return (
      saleDate.getFullYear() === year &&
      saleDate.getMonth() + 1 === month &&
      saleDate.getDate() === day
    );
  };

  const getPaymentMethodText = (paymentMethod) => {
    if (paymentMethod === "CASH") return "Efectivo";
    if (paymentMethod === "CARD") return "Tarjeta";
    if (paymentMethod === "TRANSFER") return "Transferencia";

    return paymentMethod || "Sin método";
  };

  const getSelectedDateSales = () => {
    return sales.filter((sale) => {
      const date = sale.createdAt || sale.saleDate;
      return isSelectedDate(date) && sale.status !== "CANCELLED";
    });
  };

  const buildSelectedDateSalesRows = async () => {
    const selectedDateSales = getSelectedDateSales();
    const rows = [];

    for (const sale of selectedDateSales) {
      const data = await getSaleById(sale.id);
      const saleDetail = data.responseObject || data;

      const details = saleDetail.details || [];
      const saleDate = saleDetail.createdAt || saleDetail.saleDate;

      details.forEach((detail) => {
        rows.push({
          folio: saleDetail.folio || `VENTA-${saleDetail.id}`,
          product:
            detail.productName ||
            detail.product?.name ||
            detail.name ||
            "Sin producto",
          quantity: Number(detail.quantity || 0),
          unitPrice: Number(
            detail.unitPrice || detail.price || detail.salePrice || 0
          ),
          subtotal: Number(detail.subtotal || 0),
          paymentMethod: getPaymentMethodText(saleDetail.paymentMethod),
          user: saleDetail.userName || saleDetail.user?.name || "Sin usuario",
          time: formatOnlyTime(saleDate),
          date: formatDate(saleDate),
        });
      });
    }

    return rows;
  };

  const exportSelectedDateSalesPDF = async () => {
    try {
      setExporting(true);
      setError("");

      const rows = await buildSelectedDateSalesRows();

      if (rows.length === 0) {
        setError("No hay ventas en la fecha seleccionada para exportar.");
        return;
      }

      const totalSold = rows.reduce((sum, row) => sum + row.subtotal, 0);
      const totalProducts = rows.reduce((sum, row) => sum + row.quantity, 0);
      const totalSales = getSelectedDateSales().length;

      const doc = new jsPDF("landscape");

      doc.setFontSize(16);
      doc.text("Reporte de ventas por fecha", 14, 15);

      doc.setFontSize(10);
      doc.text(`Fecha: ${getSelectedDateString()}`, 14, 23);
      doc.text(`Total ventas: ${totalSales}`, 14, 30);
      doc.text(`Total productos vendidos: ${totalProducts}`, 14, 37);
      doc.text(`Total vendido: ${formatCurrency(totalSold)}`, 14, 44);

      autoTable(doc, {
        startY: 52,
        head: [
          [
            "Folio",
            "Producto",
            "Cantidad",
            "Precio unitario",
            "Subtotal",
            "Método pago",
            "Usuario",
            "Hora",
          ],
        ],
        body: rows.map((row) => [
          row.folio,
          row.product,
          row.quantity,
          formatCurrency(row.unitPrice),
          formatCurrency(row.subtotal),
          row.paymentMethod,
          row.user,
          row.time,
        ]),
        styles: {
          fontSize: 8,
        },
        headStyles: {
          fillColor: [17, 24, 39],
        },
      });

      doc.save(`ventas-${getSelectedDateFileName()}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      setError("No se pudo exportar el reporte PDF.");
    } finally {
      setExporting(false);
    }
  };

  const exportSelectedDateSalesExcel = async () => {
    try {
      setExporting(true);
      setError("");

      const rows = await buildSelectedDateSalesRows();

      if (rows.length === 0) {
        setError("No hay ventas en la fecha seleccionada para exportar.");
        return;
      }

      const totalSold = rows.reduce((sum, row) => sum + row.subtotal, 0);
      const totalProducts = rows.reduce((sum, row) => sum + row.quantity, 0);
      const totalSales = getSelectedDateSales().length;

      const excelRows = rows.map((row) => ({
        Folio: row.folio,
        Producto: row.product,
        Cantidad: row.quantity,
        "Precio unitario": row.unitPrice,
        Subtotal: row.subtotal,
        "Método de pago": row.paymentMethod,
        Usuario: row.user,
        Hora: row.time,
        Fecha: row.date,
      }));

      excelRows.push({});
      excelRows.push({
        Folio: "RESUMEN",
        Producto: "Total ventas",
        Cantidad: totalSales,
      });
      excelRows.push({
        Folio: "RESUMEN",
        Producto: "Total productos vendidos",
        Cantidad: totalProducts,
      });
      excelRows.push({
        Folio: "RESUMEN",
        Producto: "Total vendido",
        Subtotal: totalSold,
      });

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

      XLSX.writeFile(workbook, `ventas-${getSelectedDateFileName()}.xlsx`);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      setError("No se pudo exportar el reporte Excel.");
    } finally {
      setExporting(false);
    }
  };

  const moneyKeys = [
    "todayRevenue",
    "totalRevenue",
    "totalIncome",
    "currentCashAmount",
    "cashRegisterOpeningAmount",
    "cashRegisterExpectedAmount",
  ];

  const countKeys = [
    "totalSales",
    "todaySales",
    "totalUsers",
    "totalProducts",
    "activeProducts",
    "lowStockProducts",
    "totalCategories",
    "activeCategories",
    "totalInventoryMovements",
    "totalCashMovements",
    "openCashRegister",
  ];

  const statusKeys = ["cashRegisterStatus"];
  const booleanKeys = ["hasOpenCashRegister"];

  const formatValue = (key, value) => {
    if (value === null || value === undefined) {
      if (moneyKeys.includes(key)) return "$0.00";
      return "0";
    }

    if (moneyKeys.includes(key)) return formatCurrency(value);
    if (countKeys.includes(key)) return Number(value || 0);

    if (booleanKeys.includes(key)) {
      return value ? "Sí" : "No";
    }

    if (statusKeys.includes(key)) {
      if (value === "OPEN") return "Abierta";
      if (value === "CLOSED") return "Cerrada";
      return value;
    }

    if (typeof value === "boolean") {
      return value ? "Sí" : "No";
    }

    return String(value);
  };

  const getLabel = (key) => {
    const labels = {
      todayRevenue: "Ingresos de hoy",
      totalRevenue: "Ingresos totales",
      totalIncome: "Ingresos totales",

      totalSales: "Total de ventas",
      todaySales: "Ventas de hoy",

      totalUsers: "Usuarios registrados",

      totalProducts: "Total de productos",
      activeProducts: "Productos activos",
      lowStockProducts: "Productos con stock bajo",

      totalCategories: "Total de categorías",
      activeCategories: "Categorías activas",

      totalInventoryMovements: "Movimientos de inventario",
      totalCashMovements: "Movimientos de caja",

      openCashRegister: "Caja abierta",
      hasOpenCashRegister: "¿Hay caja abierta?",
      cashRegisterStatus: "Estado de caja",
      cashRegisterOpeningAmount: "Monto inicial de caja",
      cashRegisterExpectedAmount: "Monto esperado de caja",
      currentCashAmount: "Monto actual en caja",
    };

    return labels[key] || key;
  };

  const getIcon = (key) => {
    if (
      key === "todayRevenue" ||
      key === "totalRevenue" ||
      key === "totalIncome"
    ) {
      return <FaChartLine />;
    }

    if (key === "totalSales" || key === "todaySales") {
      return <FaShoppingCart />;
    }

    if (key === "totalUsers") {
      return <FaUsers />;
    }

    if (
      key === "totalProducts" ||
      key === "activeProducts" ||
      key === "lowStockProducts"
    ) {
      return <FaBoxes />;
    }

    if (key === "totalCategories" || key === "activeCategories") {
      return <FaTags />;
    }

    if (
      key === "cashRegisterOpeningAmount" ||
      key === "cashRegisterExpectedAmount" ||
      key === "currentCashAmount" ||
      key === "cashRegisterStatus" ||
      key === "hasOpenCashRegister" ||
      key === "openCashRegister"
    ) {
      return <FaCashRegister />;
    }

    return <FaExchangeAlt />;
  };

  const getIconClass = (key) => {
    if (
      key === "todayRevenue" ||
      key === "totalRevenue" ||
      key === "totalIncome"
    ) {
      return "green";
    }

    if (
      key === "cashRegisterOpeningAmount" ||
      key === "cashRegisterExpectedAmount" ||
      key === "currentCashAmount" ||
      key === "cashRegisterStatus" ||
      key === "hasOpenCashRegister"
    ) {
      return "blue";
    }

    if (key === "lowStockProducts") {
      return "yellow";
    }

    if (key === "totalSales" || key === "todaySales") {
      return "blue";
    }

    return "gray";
  };

  const reportEntries = Object.entries(report).filter(([key, value]) => {
    return typeof value !== "object" || value === null;
  });

  const mainCards = [
    "todayRevenue",
    "totalRevenue",
    "todaySales",
    "totalSales",
  ].filter((key) => Object.prototype.hasOwnProperty.call(report, key));

  const inventoryCards = [
    "totalProducts",
    "activeProducts",
    "lowStockProducts",
    "totalCategories",
    "activeCategories",
  ].filter((key) => Object.prototype.hasOwnProperty.call(report, key));

  const cashCards = [
    "hasOpenCashRegister",
    "cashRegisterStatus",
    "cashRegisterOpeningAmount",
    "cashRegisterExpectedAmount",
    "currentCashAmount",
    "totalCashMovements",
  ].filter((key) => Object.prototype.hasOwnProperty.call(report, key));

  const activityCards = reportEntries.filter(([key]) => {
    return (
      !mainCards.includes(key) &&
      !inventoryCards.includes(key) &&
      !cashCards.includes(key)
    );
  });

  const renderReportCard = (key, value) => {
    return (
      <div className="col-12 col-sm-6 col-lg-3" key={key}>
        <div className="reports-summary-card">
          <div className="reports-summary-body">
            <div className={`reports-summary-icon ${getIconClass(key)}`}>
              {getIcon(key)}
            </div>

            <p className="reports-summary-label">{getLabel(key)}</p>

            <h3 className="reports-summary-value">
              {formatValue(key, value)}
            </h3>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="reports-page">
        <div className="reports-header">
          <div className="reports-title">
            <h1>Reportes</h1>
            <p>
              Resumen general de ventas, inventario, caja y actividad de la
              tienda.
            </p>
          </div>

          <div className="reports-actions">
            <div className="reports-date-filter">
              <label>Fecha del reporte</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <button
              className="btn btn-outline-danger reports-export-btn"
              onClick={exportSelectedDateSalesPDF}
              disabled={exporting}
            >
              <FaFilePdf className="me-2" />
              PDF ventas
            </button>

            <button
              className="btn btn-outline-success reports-export-btn"
              onClick={exportSelectedDateSalesExcel}
              disabled={exporting}
            >
              <FaFileExcel className="me-2" />
              Excel ventas
            </button>

            <button
              className="btn btn-primary reports-refresh-btn"
              onClick={loadReport}
              disabled={exporting}
            >
              <FaRedo className="me-2" />
              Actualizar
            </button>
          </div>
        </div>

        {exporting && (
          <div className="alert alert-info">
            Generando reporte, espera un momento...
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {loading && <div className="alert alert-info">Cargando reportes...</div>}

        {!loading && !error && (
          <>
            {reportEntries.length === 0 ? (
              <div className="alert alert-warning">
                No hay información disponible para mostrar.
              </div>
            ) : (
              <>
                <div className="reports-section">
                  <div className="reports-section-header">
                    <h5>Resumen principal</h5>
                    <p>Indicadores generales de ventas e ingresos.</p>
                  </div>

                  <div className="row g-4 mb-4">
                    {mainCards.length > 0
                      ? mainCards.map((key) => renderReportCard(key, report[key]))
                      : reportEntries
                          .slice(0, 4)
                          .map(([key, value]) => renderReportCard(key, value))}
                  </div>
                </div>

                {inventoryCards.length > 0 && (
                  <div className="reports-section">
                    <div className="reports-section-header">
                      <h5>Inventario y productos</h5>
                      <p>Estado general de productos, categorías y stock.</p>
                    </div>

                    <div className="row g-4 mb-4">
                      {inventoryCards.map((key) =>
                        renderReportCard(key, report[key])
                      )}
                    </div>
                  </div>
                )}

                {cashCards.length > 0 && (
                  <div className="reports-section">
                    <div className="reports-section-header">
                      <h5>Caja</h5>
                      <p>Información de caja actual y movimientos.</p>
                    </div>

                    <div className="row g-4 mb-4">
                      {cashCards.map((key) => renderReportCard(key, report[key]))}
                    </div>
                  </div>
                )}

                {activityCards.length > 0 && (
                  <div className="reports-section">
                    <div className="reports-section-header">
                      <h5>Actividad general</h5>
                      <p>Otros indicadores registrados por el sistema.</p>
                    </div>

                    <div className="row g-4 mb-4">
                      {activityCards.map(([key, value]) =>
                        renderReportCard(key, value)
                      )}
                    </div>
                  </div>
                )}

                <div className="card reports-detail-card mt-2">
                  <div className="card-body">
                    <div className="reports-toolbar">
                      <div>
                        <h5>Detalle del reporte</h5>
                        <p>{reportEntries.length} concepto(s) encontrados.</p>
                      </div>
                    </div>

                    <div className="reports-table-wrapper">
                      <table className="table table-hover align-middle reports-table">
                        <thead>
                          <tr>
                            <th>Concepto</th>
                            <th>Valor</th>
                          </tr>
                        </thead>

                        <tbody>
                          {reportEntries.length === 0 ? (
                            <tr>
                              <td colSpan="2" className="text-center text-muted py-4">
                                No hay datos disponibles.
                              </td>
                            </tr>
                          ) : (
                            reportEntries.map(([key, value]) => (
                              <tr key={key}>
                                <td>
                                  <div className="report-concept">
                                    {getLabel(key)}
                                  </div>
                                  <div className="report-key">{key}</div>
                                </td>

                                <td>
                                  <strong>{formatValue(key, value)}</strong>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default Reports;