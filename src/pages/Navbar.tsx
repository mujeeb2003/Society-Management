import { CircleUser, Menu, Search, Activity } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/types";
import { userLogout } from "@/redux/user/userSlice";
function Navbar() {
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;
    return (
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link
                    to="/home"
                    className={`flex items-center gap-2 text-lg font-semibold md:text-base text-white`}
                >
                    <Activity className="h-6 w-6" />
                    {/* <span className="sr-only"></span> */}
                </Link>
                <Link
                    to="/home"
                    className={`${
                        isActive("/home")
                            ? "text-foreground"
                            : "text-muted-foreground"
                    } transition-colors hover:text-foreground`}
                >
                    Dashboard
                </Link>
                <Link
                    to="/home/payments"
                    className={`${
                        isActive("/home/payments")
                            ? "text-foreground"
                            : "text-muted-foreground"
                    } transition-colors hover:text-foreground`}
                >
                    Payments
                </Link>
                <Link
                    to="/home/villas"
                    className={`${
                        isActive("/home/villas")
                            ? "text-foreground"
                            : "text-muted-foreground"
                    } transition-colors hover:text-foreground`}
                >
                    Villas
                </Link>
                <Link
                    to="/home/settings"
                    className={`${
                        isActive("/home/settings")
                            ? "text-foreground"
                            : "text-muted-foreground"
                    } transition-colors hover:text-foreground`}
                >
                    Settings
                </Link>
            </nav>
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <Menu className="h-5 w-5 text-foreground" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <nav className="grid gap-6 text-lg font-medium">
                        <Link
                            to="/home"
                            className="flex items-center gap-2 text-lg font-semibold text-foreground"
                        >
                            <Activity className="h-6 w-6" />
                        </Link>
                        <Link to="/home" className="hover:text-foreground">
                            Dashboard
                        </Link>
                        <Link
                            to="/home/payments"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Payments
                        </Link>
                        <Link
                            to="/home/villas"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Villas
                        </Link>
                        <Link
                            to="/home/settings"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Settings
                        </Link>
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <form className="ml-auto flex-1 sm:flex-initial">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search villas..."
                            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                        />
                    </div>
                </form>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full"
                        >
                            <CircleUser className="h-5 w-5" />
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            <Link to="/home/settings">My Account</Link>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => dispatch(userLogout())}
                        >
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

export default Navbar;
