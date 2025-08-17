import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { userLogin } from "@/redux/user/userSlice";
import type { AppDispatch, RootState } from "@/types";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

export const description =
    "A simple login form with email and password. The submit button says 'Sign in'.";

export function LoginForm() {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, isLoggedIn, user } = useSelector(
        (state: RootState) => state.user
    );
    const { toast } = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    // Redirect if already logged in
    useEffect(() => {
        if (isLoggedIn && user.id !== 0) {
            navigate("/home");
        }
    }, [isLoggedIn, user.id, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async () => {
        if (!formData.email || !formData.password) {
            toast({
                title: "Validation Error",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await dispatch(userLogin(formData));

            if (response.payload.error) {
                toast({
                    title: "Login Failed",
                    description: response.payload.error,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Login Successful",
                description: `Welcome back, ${response.payload.data.firstName}!`,
            });
            navigate("/home");
        } catch (error: any) {
            toast({
                title: "Login Failed",
                description: error.message || "An unexpected error occurred",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-black/50">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="m@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSubmit();
                            }}
                            disabled={loading}
                            required
                        />
                    </div>
                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </Button>
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link to="/signup" className="underline">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
