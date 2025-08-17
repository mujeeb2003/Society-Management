import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { LoginForm } from "./pages/LoginForm";
import { SignupForm } from "./pages/SignupForm";
import { Toaster } from "@/components/ui/toaster";
import { Dashboard } from "./pages/Dashboard";
import Navbar from "./pages/Navbar";
import Payments from "./pages/Payments";
import Villas from "./pages/Villas";
import Settings from "./pages/Settings";
import PaymentCategoriesManagement from "./pages/PaymentCategoriesManagement";
import Reports from "./pages/Reports";
import ProtectedRoute from "./utils/ProtectedRoute";
import type { AppDispatch } from "./types";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getPayments, getVillas, updateUser } from "./redux/user/userSlice";
import { RootState } from "./types";
import ExpensesManagement from "./pages/Expenses";

function App() {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoggedIn } = useSelector((state: RootState) => state.user);

    useEffect(() => {
        dispatch(updateUser());
    }, [dispatch]);

    // Only fetch data if user is logged in
    useEffect(() => {
        if (isLoggedIn) {
            dispatch(getPayments());
            dispatch(getVillas());
        }
    }, [dispatch, isLoggedIn]);

    return (
        <>
            <Toaster />
            <Router>
                <Routes>
                    <Route path="/" element={<LoginForm />} />
                    <Route path="/signup" element={<SignupForm />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route
                            path="/home/*"
                            element={
                                <>
                                    <Navbar />
                                    <Routes>
                                        <Route
                                            path="/"
                                            element={<Dashboard />}
                                        />
                                        <Route
                                            path="/payments"
                                            element={<Payments />}
                                        />
                                        <Route
                                            path="/villas"
                                            element={<Villas />}
                                        />
                                        <Route
                                            path="/paymentCategories"
                                            element={<PaymentCategoriesManagement />}
                                        />
                                        <Route
                                            path="/expenses"
                                            element={<ExpensesManagement />}
                                        />
                                        <Route
                                            path="/reports"
                                            element={<Reports />}
                                        />
                                        <Route
                                            path="/settings"
                                            element={<Settings />}
                                        />
                                    </Routes>
                                </>
                            }
                        />
                    </Route>
                </Routes>
            </Router>
        </>
    );
}

export default App;
