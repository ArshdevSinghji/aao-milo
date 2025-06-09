import { Outlet, Navigate } from "react-router-dom";
import { useAppSelector } from "../redux/hook";

const ProtectedRoutes = () => {
  const isAuth = useAppSelector((state) => state.auth.isAuth);
  return isAuth ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoutes;
