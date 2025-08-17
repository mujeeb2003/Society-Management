import {
    ArrowUpRight,
    HomeIcon as House,
    TrendingUp,
    TrendingDown,
    DollarSign,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, type RootState, type DashboardStats } from "@/types";
import { useEffect, useState } from "react";
import { getDashboardStats, getDashboardSummary } from "@/redux/user/userSlice";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
    const { loading } = useSelector((state: RootState) => state.user);
    const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
        null
    );
    const [quickSummary, setQuickSummary] = useState<any>(null);
    const dispatch = useDispatch<AppDispatch>();
    const { toast } = useToast();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Get comprehensive dashboard stats
                const statsResponse = await dispatch(
                    getDashboardStats()
                ).unwrap();
                if (statsResponse.success) {
                    setDashboardData(statsResponse.data);
                }

                // Get quick summary for cards
                const summaryResponse = await dispatch(
                    getDashboardSummary()
                ).unwrap();
                if (summaryResponse.success) {
                    setQuickSummary(summaryResponse.data);
                }
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: "Failed to load dashboard data",
                    variant: "destructive",
                });
                console.error("Dashboard error:", error);
            }
        };

        fetchDashboardData();
    }, [dispatch, toast]);

    const formatCurrency = (amount: number) => {
        return `PKR ${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // const getStatusBadgeVariant = (status: string) => {
    //     switch (status) {
    //         case "PAID":
    //             return "default";
    //         case "PARTIAL":
    //             return "secondary";
    //         case "NOT_PAID":
    //             return "destructive";
    //         default:
    //             return "outline";
    //     }
    // };

    if (loading || !dashboardData || !quickSummary) {
        return (
            <div className="flex min-h-screen w-full flex-col mt-0">
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                    <div className="grid gap-4 md:grid-cols-2 md:gap-10 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <main className="flex flex-1 flex-col p-4 md:gap-8 md:px-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">
                            {dashboardData.overview.monthName}{" "}
                            {dashboardData.overview.currentYear} Overview
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Monthly Received
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(quickSummary.monthlyReceived)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Collection Rate:{" "}
                                {dashboardData.monthlyFinancials.collectionRate}
                                %
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Monthly Pending
                            </CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(quickSummary.monthlyPending)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData.paymentStats.villasUnpaid} villas
                                unpaid
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Monthly Expenses
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {formatCurrency(quickSummary.monthlyExpenses)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData.expenseStats.expenseTransactions}{" "}
                                transactions
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Net Balance
                            </CardTitle>
                            <House className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${
                                    quickSummary.netBalance >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {formatCurrency(quickSummary.netBalance)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData.villaStats.totalVillas} total
                                villas
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Payment Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm">
                                            Fully Paid
                                        </span>
                                    </div>
                                    <span className="font-semibold">
                                        {
                                            dashboardData.paymentStats
                                                .villasFullyPaid
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <span className="text-sm">
                                            Partially Paid
                                        </span>
                                    </div>
                                    <span className="font-semibold">
                                        {
                                            dashboardData.paymentStats
                                                .villasPartiallyPaid
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <span className="text-sm">
                                            Not Paid
                                        </span>
                                    </div>
                                    <span className="font-semibold">
                                        {
                                            dashboardData.paymentStats
                                                .villasUnpaid
                                        }
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Villa Occupancy
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm">
                                            Occupied
                                        </span>
                                    </div>
                                    <span className="font-semibold">
                                        {dashboardData.villaStats
                                            .occupancyBreakdown.occupied || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                        <span className="text-sm">Vacant</span>
                                    </div>
                                    <span className="font-semibold">
                                        {dashboardData.villaStats
                                            .occupancyBreakdown.vacant || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                        <span className="text-sm">Total</span>
                                    </div>
                                    <span className="font-semibold">
                                        {dashboardData.villaStats.totalVillas}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                This Month
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {
                                            dashboardData.paymentStats
                                                .totalPaymentTransactions
                                        }
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Payment Transactions
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-semibold text-orange-600">
                                        {
                                            dashboardData.expenseStats
                                                .expenseTransactions
                                        }
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Expense Transactions
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Transactions & Top Pending */}
                <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-2">
                                <CardTitle>Recent Payments</CardTitle>
                                <CardDescription>
                                    Latest payments from villa residents
                                </CardDescription>
                            </div>
                            <Button asChild size="sm" className="ml-auto gap-1">
                                <Link to="/home/payments">
                                    View All
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Resident</TableHead>
                                        <TableHead>Villa</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dashboardData.recentPayments.map(
                                        (payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {payment.residentName ||
                                                            "N/A"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {payment.villaNumber}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {payment.categoryName}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(
                                                        payment.paymentDate
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(
                                                        payment.receivedAmount
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Pending Payments</CardTitle>
                            <CardDescription>
                                Villas with highest outstanding amounts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            {dashboardData.topPendingVillas.map((villa) => (
                                <div
                                    className="flex items-center gap-4"
                                    key={`${villa.villaNumber}-${villa.residentName}`}
                                >
                                    <Avatar className="hidden h-9 w-9 sm:flex">
                                        <AvatarImage
                                            src="/avatars/01.png"
                                            alt="Avatar"
                                        />
                                        <AvatarFallback>
                                            {villa.residentName?.charAt(0) ||
                                                villa.villaNumber.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-1">
                                        <p className="text-sm font-medium leading-none">
                                            {villa.residentName || "N/A"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Villa {villa.villaNumber}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-red-600">
                                        +{formatCurrency(villa.pendingAmount)}
                                    </div>
                                </div>
                            ))}
                            {dashboardData.topPendingVillas.length === 0 && (
                                <div className="text-center text-muted-foreground py-4">
                                    No pending payments found
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Category Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Category Performance</CardTitle>
                        <CardDescription>
                            Collection rates by payment category
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Expected</TableHead>
                                    <TableHead>Received</TableHead>
                                    <TableHead>Transactions</TableHead>
                                    <TableHead className="text-right">
                                        Collection Rate
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboardData.categoryBreakdown.map(
                                    (category) => (
                                        <TableRow key={category.categoryName}>
                                            <TableCell className="font-medium">
                                                {category.categoryName}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(
                                                    category.totalReceivable
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(
                                                    category.totalReceived
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {category.transactionCount}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant={
                                                        category.collectionRate >=
                                                        80
                                                            ? "default"
                                                            : category.collectionRate >=
                                                              60
                                                            ? "secondary"
                                                            : "destructive"
                                                    }
                                                >
                                                    {category.collectionRate.toFixed(
                                                        1
                                                    )}
                                                    %
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
