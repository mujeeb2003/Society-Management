import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    AppDispatch,
    RootState,
    type Expense,
    type ExpenseAnalytics,
} from "@/types";
import {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseAnalytics,
    getExpenseCategories,
} from "@/redux/user/userSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plus,
    Receipt,
    Edit,
    Trash2,
    AlertTriangle,
    MoreHorizontal,
    TrendingUp,
    DollarSign,
    Calendar,
    Filter,
    FileText,
    BarChart3,
} from "lucide-react";
import { ExpenseModal } from "./modals/expenseModal";
import { format } from "date-fns";

export default function ExpensesManagement() {
    const dispatch = useDispatch<AppDispatch>();
    const { expenses, loading } = useSelector((state: RootState) => state.user);
    const { toast } = useToast();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<Expense | null>(
        null
    );

    const [filter, setFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [monthFilter, setMonthFilter] = useState("ALL");
    const [yearFilter, setYearFilter] = useState(
        new Date().getFullYear().toString()
    );
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");

    const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
    const [categories, setCategories] = useState<string[]>([]);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Load data on component mount
    useEffect(() => {
        dispatch(getExpenses({}));
        dispatch(getExpenseCategories()).then((result: any) => {
            if (result.payload?.data) {
                setCategories(result.payload.data);
            }
        });
        loadAnalytics(currentYear);
    }, [dispatch]);

    const loadAnalytics = async (year: number) => {
        try {
            console.log('Loading analytics for year:', year);
            const result = await dispatch(getExpenseAnalytics(year)).unwrap();
            console.log('Analytics result:', result);
            if (result.data) {
                console.log('Analytics summary totalCount:', result.data.summary?.totalCount, typeof result.data.summary?.totalCount);
                setAnalytics(result.data);
                console.log('Analytics data set:', result.data);
            }
        } catch (error) {
            console.error("Failed to load analytics:", error);
            toast({
                title: "Failed to load analytics",
                description: "Unable to load expense analytics. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Filter expenses
    const filteredExpenses = useMemo(() => {
        return expenses.filter((expense) => {
            const matchesSearch =
                expense.description
                    .toLowerCase()
                    .includes(filter.toLowerCase()) ||
                expense.category.toLowerCase().includes(filter.toLowerCase());
            const matchesCategory =
                categoryFilter === "ALL" || expense.category === categoryFilter;

            const matchesMonth =
                monthFilter === "ALL" ||
                expense.expenseMonth === parseInt(monthFilter);
            console.log(expense);
            const matchesYear = expense.expenseYear === parseInt(yearFilter);

            const matchesPaymentMethod =
                paymentMethodFilter === "ALL" ||
                expense.paymentMethod === paymentMethodFilter;

            console.log(matchesSearch, matchesCategory, matchesMonth, matchesYear, matchesPaymentMethod);
            return (
                matchesSearch &&
                matchesCategory &&
                matchesMonth &&
                matchesYear &&
                matchesPaymentMethod
            );
        });
    }, [
        expenses,
        filter,
        categoryFilter,
        monthFilter,
        yearFilter,
        paymentMethodFilter,
    ]);

    console.log(filteredExpenses);

    // Calculate summary stats
    const summaryStats = useMemo(() => {
        const total = filteredExpenses.reduce(
            (sum, expense) => sum + Number(expense.amount),
            0
        );
        const count = filteredExpenses.length;
        const average = count > 0 ? total / count : 0;

        const thisMonthExpenses = filteredExpenses.filter(
            (e) =>
                e.expenseMonth === currentMonth &&
                e.expenseYear === currentYear
        );
        const thisMonthTotal = thisMonthExpenses.reduce(
            (sum, expense) => sum + Number(expense.amount),
            0
        );

        return { total, count, average, thisMonthTotal };
    }, [filteredExpenses, currentMonth, currentYear]);

    const handleCreateExpense = async (expenseData: Expense) => {
        try {
            const response = await dispatch(
                createExpense(expenseData)
            ).unwrap();

            if (response.error) {
                toast({
                    title: "Failed to create expense",
                    description: response.error,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Expense Created",
                description: `${expenseData.category} expense has been created successfully.`,
            });

            setIsCreateModalOpen(false);
            dispatch(getExpenses({}));
            loadAnalytics(parseInt(yearFilter));
        } catch (error: any) {
            toast({
                title: "Failed to create expense",
                description: error.error || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    };

    const handleEditExpense = async (expenseData: Expense) => {
        try {
            const response = await dispatch(
                updateExpense(expenseData)
            ).unwrap();

            if (response.error) {
                toast({
                    title: "Failed to update expense",
                    description: response.error,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Expense Updated",
                description: `${expenseData.category} expense has been updated successfully.`,
            });

            setIsEditModalOpen(false);
            setEditingExpense(null);
            dispatch(getExpenses({}));
            loadAnalytics(parseInt(yearFilter));
        } catch (error: any) {
            toast({
                title: "Failed to update expense",
                description: error.error || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingExpense) return;

        try {
            const response = await dispatch(
                deleteExpense(deletingExpense.id)
            ).unwrap();

            if (response.error) {
                toast({
                    title: "Failed to delete expense",
                    description: response.error,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Expense Deleted",
                description: `${deletingExpense.category} expense has been deleted successfully.`,
            });

            setIsDeleteDialogOpen(false);
            setDeletingExpense(null);
            dispatch(getExpenses({}));
            loadAnalytics(parseInt(yearFilter));
        } catch (error: any) {
            toast({
                title: "Failed to delete expense",
                description: error.error || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    };

    const openEditDialog = (expense: Expense) => {
        setEditingExpense({ ...expense });
        setIsEditModalOpen(true);
    };

    const openDeleteDialog = (expense: Expense) => {
        setDeletingExpense(expense);
        setIsDeleteDialogOpen(true);
    };

    const getPaymentMethodBadge = (method: string) => {
        const colors: { [key: string]: string } = {
            CASH: "bg-green-100 text-green-800",
            CARD: "bg-blue-100 text-blue-800",
            BANK_TRANSFER: "bg-purple-100 text-purple-800",
            CHEQUE: "bg-orange-100 text-orange-800",
            ONLINE: "bg-pink-100 text-pink-800",
        };

        return (
            <Badge
                className={`${colors[method] || "bg-gray-100 text-gray-800"}`}
            >
                {method.replace("_", " ")}
            </Badge>
        );
    };

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    return (
        <div className="container px-4 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Receipt className="h-8 w-8" />
                        Expense Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage all community expenses
                    </p>
                </div>

                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={loading}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                </Button>
            </div>

            <Tabs defaultValue="expenses" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="expenses">
                        <FileText className="w-4 h-4 mr-2" />
                        Expenses
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="expenses" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold">
                                            PKR{" "}
                                            {summaryStats.total.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Total Filtered
                                        </p>
                                    </div>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold">
                                            {summaryStats.count}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Total Expenses
                                        </p>
                                    </div>
                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold">
                                            PKR{" "}
                                            {summaryStats.average.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Average Amount
                                        </p>
                                    </div>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-orange-600">
                                            PKR{" "}
                                            {summaryStats.thisMonthTotal.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            This Month
                                        </p>
                                    </div>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                <Input
                                    placeholder="Search expenses..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="col-span-2"
                                />
                                <Select
                                    value={categoryFilter}
                                    onValueChange={setCategoryFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">
                                            All Categories
                                        </SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={monthFilter}
                                    onValueChange={setMonthFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Months" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">
                                            All Months
                                        </SelectItem>
                                        {months.map((month, index) => (
                                            <SelectItem
                                                key={month}
                                                value={(index + 1).toString()}
                                            >
                                                {month}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={yearFilter}
                                    onValueChange={setYearFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[
                                            currentYear,
                                            currentYear - 1,
                                            currentYear - 2,
                                        ].map((year) => (
                                            <SelectItem
                                                key={year}
                                                value={year.toString()}
                                            >
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={paymentMethodFilter}
                                    onValueChange={setPaymentMethodFilter}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Methods" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">
                                            All Methods
                                        </SelectItem>
                                        <SelectItem value="CASH">
                                            Cash
                                        </SelectItem>
                                        <SelectItem value="CARD">
                                            Card
                                        </SelectItem>
                                        <SelectItem value="BANK_TRANSFER">
                                            Bank Transfer
                                        </SelectItem>
                                        <SelectItem value="CHEQUE">
                                            Cheque
                                        </SelectItem>
                                        <SelectItem value="ONLINE">
                                            Online
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expenses Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Expenses
                                <Badge variant="secondary" className="ml-2">
                                    {filteredExpenses.length} expenses
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {filteredExpenses.length === 0 ? (
                                <div className="text-center py-12">
                                    <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">
                                        No Expenses Found
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        {filter ||
                                        categoryFilter !== "ALL" ||
                                        monthFilter !== "ALL"
                                            ? "No expenses match your current filters."
                                            : "Get started by adding your first expense."}
                                    </p>
                                    {!filter &&
                                        categoryFilter === "ALL" &&
                                        monthFilter === "ALL" && (
                                            <Button
                                                onClick={() =>
                                                    setIsCreateModalOpen(true)
                                                }
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Your First Expense
                                            </Button>
                                        )}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>
                                                Payment Method
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExpenses.map((expense) => (
                                            <TableRow key={expense.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {format(
                                                            new Date(
                                                                expense.expenseDate
                                                            ),
                                                            "MMM dd, yyyy"
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {expense.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate">
                                                        {expense.description}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-red-600">
                                                        PKR{" "}
                                                        {expense.amount.toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getPaymentMethodBadge(
                                                        expense.paymentMethod
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>
                                                                Actions
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openEditDialog(
                                                                        expense
                                                                    )
                                                                }
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openDeleteDialog(
                                                                        expense
                                                                    )
                                                                }
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    {analytics ? (
                        <>
                            {/* Analytics Summary */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">
                                            PKR{" "}
                                            {analytics.summary?.totalAmount?.toLocaleString() || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Total Amount ({analytics.year || currentYear})
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">
                                            {typeof analytics.summary?.totalCount === 'object' 
                                                ? analytics.summary?.totalCount || 0 
                                                : analytics.summary?.totalCount || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Total Transactions
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">
                                            PKR{" "}
                                            {analytics.summary?.averagePerExpense?.toLocaleString() || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Average per Expense
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">
                                            PKR{" "}
                                            {analytics.summary?.averagePerMonth?.toLocaleString() || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Average per Month
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Top Categories */}
                            {analytics.topCategories && analytics.topCategories.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Top Expense Categories
                                        </CardTitle>
                                        <CardDescription>
                                            Highest spending categories for{" "}
                                            {analytics.year || currentYear}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {analytics.topCategories.map(
                                                (category, index) => (
                                                    <div
                                                        key={`category-${index}-${category.category || index}`}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">
                                                                    {category.category || 'Unknown Category'}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {category.count || 0}{" "}
                                                                    transactions
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-medium">
                                                                PKR{" "}
                                                                {(category.amount || 0).toLocaleString()}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {category.percentage || '0'}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Top Expense Categories
                                        </CardTitle>
                                        <CardDescription>
                                            No expense data available for{" "}
                                            {analytics.year || currentYear}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8">
                                            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                            <p className="text-muted-foreground">
                                                No expense data to show
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Monthly Breakdown */}
                            {analytics.monthlyBreakdown && analytics.monthlyBreakdown.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Monthly Breakdown</CardTitle>
                                        <CardDescription>
                                            Monthly expense totals for {analytics.year || currentYear}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {analytics.monthlyBreakdown.map((monthData, index) => (
                                                <div
                                                    key={`month-${monthData.month || index}`}
                                                    className="flex items-center justify-between p-3 border rounded-lg"
                                                >
                                                    <div className="font-medium">
                                                        {monthData.monthName || `Month ${monthData.month || index + 1}`}
                                                    </div>
                                                    <div className="font-medium text-red-600">
                                                        PKR {(monthData.amount || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Loading Analytics</h3>
                            <p className="text-muted-foreground">
                                Please wait while we load the expense analytics...
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create Expense Modal */}
            <ExpenseModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateExpense}
                loading={loading}
                categories={categories}
            />

            {/* Edit Expense Modal */}
            <ExpenseModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEditExpense}
                expenseToEdit={editingExpense}
                loading={loading}
                categories={categories}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Delete Expense
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this expense? This
                            action cannot be undone.
                            <div className="mt-2 p-2 bg-muted rounded">
                                <strong>{deletingExpense?.category}</strong> -
                                PKR {deletingExpense?.amount.toLocaleString()}
                                <br />
                                <span className="text-sm text-muted-foreground">
                                    {deletingExpense?.description}
                                </span>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={loading}
                        >
                            {loading ? "Deleting..." : "Delete Expense"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
