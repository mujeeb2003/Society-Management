import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { LoginForm } from "./pages/LoginForm";
import { SignupForm } from "./pages/SignupForm";
import { Toaster } from "@/components/ui/toaster";
import { Dashboard } from "./pages/Dashboard";
import Navbar from "./pages/Navbar";
import Payments from "./pages/Payments";
import Villas from "./pages/Villas";
import Settings from "./pages/Settings";
import type { AppDispatch } from "./types";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { getPayments, getVillas, updateUser } from "./redux/user/userSlice";
function App() {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(getPayments());
        dispatch(getVillas());
        dispatch(updateUser());
    }, [dispatch]);

    return (
        <>
            <Toaster />
            <Router>
                <Routes>
                    <Route path="/" element={<LoginForm />} />
                    <Route path="/signup" element={<SignupForm />} />
                    <Route >
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
