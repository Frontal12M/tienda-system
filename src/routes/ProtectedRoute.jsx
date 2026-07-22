import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const authData = JSON.parse(localStorage.getItem("authData"));
  const user = authData || JSON.parse(localStorage.getItem("user"));

  if (!user?.token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;