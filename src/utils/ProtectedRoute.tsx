import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { RootState } from "@/types";

export default function ProtectedRoute() {
    const { user, isLoggedIn } = useSelector((state: RootState) => state.user);
    
    // Check if user is authenticated
    const isAuthenticated = isLoggedIn && user.id !== 0;

    return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}