import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import ProtectedRoute from "./routes/ProtectedRoute";
import InventoryMovements from "./pages/InventoryMovements";
import Sales from "./pages/Sales";
import CashRegister from "./pages/CashRegister";
import CashMovements from "./pages/CashMovements";
import Reports from "./pages/Reports";
import Users from "./pages/Users";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "CASHIER"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "CASHIER"]}>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
              <InventoryMovements />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "CASHIER"]}>
              <Sales />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cash-register"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "CASHIER"]}>
              <CashRegister />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cash-movements"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "CASHIER"]}>
              <CashMovements />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "ADMIN"]}>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;