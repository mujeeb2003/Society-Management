import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { RootState } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function ProtectedLoginRoute() {
    const { user } = useSelector((state: RootState) => state.user);
    const { toast } = useToast();
    const isLogged = user.id !== 0;

    !isLogged &&
        toast({
            variant: "destructive",
            title: "Authentication",
            description: `Please Login First`,
        });

    return isLogged ? <Outlet /> : <Navigate to="/" />;
}
