  import { Navigate } from "react-router-dom";
  import { useAuth } from "../../context/AuthContext";

  function RoleRoute({ children, allowedRoles }) {
    const { auth } = useAuth();

    if (!auth.token) {
      return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(auth.role)) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  }

  export default RoleRoute;