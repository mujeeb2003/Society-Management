import {  useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import {  AppDispatch, RootState } from "@/types";
import { useToast } from "@/hooks/use-toast"
import { checkUserLogin, updateUser } from "@/redux/user/userSlice";

export default function ProtectedLoginRoute() {
    const { isLoggedIn } = useSelector((state:RootState)=>state.user);
    const dispatch = useDispatch<AppDispatch>();
    const { toast } = useToast();

    const res = checkUserLogin();
    res && dispatch(updateUser(res));

    !isLoggedIn && toast({ variant: "destructive", title: "Authentication", description: `Please Login First` });

    return isLoggedIn ? <Outlet /> : <Navigate to="/"/>
}
