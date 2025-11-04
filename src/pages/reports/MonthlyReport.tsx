import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/types";
import {
    generateMonthlyReport,
    exportMonthlyReport,
} from "@/redux/user/userSlice";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    ArrowLeft,
    Download,
    FileText,
    TrendingUp,
    TrendingDown,
    Home,
    DollarSign,
    Calendar,
    Users,
    AlertCircle,
} from "lucide-react";
import { MonthlyReport as MonthlyReportType } from "@/types";

interface MonthlyReportProps {
    onBack: () => void;
}

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

export default function MonthlyReport({ onBack }: MonthlyReportProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { toast } = useToast();

    const [selectedMonth, setSelectedMonth] = useState<number>(
        new Date().getMonth() + 1
    );
    const [selectedYear, setSelectedYear] = useState<number>(
        new Date().getFullYear()
    );
    const [reportData, setReportData] = useState<MonthlyReportType | null>(
        null
    );
    const [loading, setLoading] = useState(false);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const result = await dispatch(
                generateMonthlyReport({
                    month: selectedMonth,
                    year: selectedYear,
                })
            ).unwrap();

            setReportData(result.data);
            toast({
                title: "Report Generated",
                description: `Monthly report for ${
                    months[selectedMonth - 1]
                } ${selectedYear} generated successfully`,
            });
        } catch (error: any) {
            console.error("Report generation error:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to generate report",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = async () => {
        if (!reportData) {
            toast({
                title: "Error",
                description: "Please generate a report first before exporting",
                variant: "destructive",
            });
            return;
        }

        try {
            await dispatch(
                exportMonthlyReport({
                    month: selectedMonth,
                    year: selectedYear,
                })
            ).unwrap();

            toast({
                title: "Export Successful",
                description: "Monthly report exported to Excel successfully",
            });
        } catch (error: any) {
            console.error("Export error:", error);
            toast({
                title: "Export Failed",
                description: error.message || "Failed to export report",
                variant: "destructive",
            });
        }
    };

    const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

    const getStatusBadge = (status: string) => {
        const variants = {
            PAID: "bg-green-100 text-green-800 border-green-200",
            PARTIAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
            NOT_PAID: "bg-red-100 text-red-800 border-red-200",
            NOT_APPLICABLE: "bg-gray-100 text-gray-600 border-gray-200",
        };

        return (
            <Badge
                className={
                    variants[status as keyof typeof variants] ||
                    variants.NOT_APPLICABLE
                }
            >
                {status.replace("_", " ")}
            </Badge>
        );
    };



    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onBack}
                        className="hover:bg-gray-50"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Reports
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Monthly Financial Report
                        </h1>
                        <p className="text-muted-foreground">
                            Comprehensive monthly financial analysis
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                        Report Parameters
                    </CardTitle>
                    <CardDescription>
                        Select the month and year for which you want to generate
                        the report
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Month
                        </label>
                        <Select
                            value={selectedMonth.toString()}
                            onValueChange={(value) =>
                                setSelectedMonth(parseInt(value))
                            }
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((month, index) => (
                                    <SelectItem
                                        key={index}
                                        value={(index + 1).toString()}
                                    >
                                        {month}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Year
                        </label>
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(value) =>
                                setSelectedYear(parseInt(value))
                            }
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from(
                                    { length: 5 },
                                    (_, i) => new Date().getFullYear() - i
                                ).map((year) => (
                                    <SelectItem
                                        key={year}
                                        value={year.toString()}
                                    >
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleGenerateReport}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        {loading ? "Generating..." : "Generate Report"}
                    </Button>

                    {reportData && (
                        <Button
                            onClick={handleExportReport}
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Excel
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Report Content */}
            {reportData && (
                <div className="space-y-6">
                    {/* Financial Summary */}
                    <Card className="border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center">
                                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                                Financial Summary - {reportData.monthName}{" "}
                                {reportData.year}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="text-sm text-blue-600 font-medium mb-1">
                                        Previous Balance
                                    </div>
                                    <div className="text-2xl font-bold text-blue-700">
                                        {formatCurrency(
                                            reportData.summary.previousBalance
                                        )}
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="text-sm text-green-600 font-medium mb-1">
                                        Total Receipts
                                    </div>
                                    <div className="text-2xl font-bold text-green-700 flex items-center">
                                        <TrendingUp className="h-5 w-5 mr-1" />
                                        {formatCurrency(
                                            reportData.summary.totalReceipts
                                        )}
                                    </div>
                                </div>

                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <div className="text-sm text-red-600 font-medium mb-1">
                                        Total Expenses
                                    </div>
                                    <div className="text-2xl font-bold text-red-700 flex items-center">
                                        <TrendingDown className="h-5 w-5 mr-1" />
                                        {formatCurrency(
                                            reportData.summary.totalExpenses
                                        )}
                                    </div>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="text-sm text-purple-600 font-medium mb-1">
                                        Current Balance
                                    </div>
                                    <div className="text-2xl font-bold text-purple-700">
                                        {formatCurrency(
                                            reportData.summary.currentBalance
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Villa Payments Table */}
                    <Card className="border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center">
                                <Home className="h-5 w-5 mr-2 text-purple-600" />
                                Villa-wise Payment Details
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Detailed breakdown of payments by villa for{" "}
                                {reportData.monthName} {reportData.year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-semibold">
                                                Villa
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Resident
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Type
                                            </TableHead>
                                            <TableHead className="font-semibold text-right">
                                                Receivable
                                            </TableHead>
                                            <TableHead className="font-semibold text-right">
                                                Received
                                            </TableHead>
                                            <TableHead className="font-semibold text-right">
                                                Pending
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Status
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.villaPayments.map((villa, index) => (
                                            <TableRow
                                                key={index}
                                                className="hover:bg-gray-50"
                                            >
                                                    <TableCell className="font-medium">
                                                        {villa.villaNumber}
                                                    </TableCell>
                                                    <TableCell>
                                                        {villa.residentName ||
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {villa.occupancyType}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(
                                                            villa.receivableAmount
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-green-600 font-medium">
                                                        {formatCurrency(
                                                            villa.receivedAmount
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600 font-medium">
                                                        {formatCurrency(
                                                            villa.pendingAmount
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(
                                                            villa.paymentStatus
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center">
                                    <Users className="h-5 w-5 mr-2 text-orange-600" />
                                    Payment Statistics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(() => {
                                        const stats =
                                            reportData.villaPayments.reduce(
                                                (acc, villa) => {
                                                    acc.total++;
                                                    if (
                                                        villa.paymentStatus ===
                                                        "PAID"
                                                    )
                                                        acc.paid++;
                                                    else if (
                                                        villa.paymentStatus ===
                                                        "PARTIAL"
                                                    )
                                                        acc.partial++;
                                                    else if (
                                                        villa.paymentStatus ===
                                                        "NOT_PAID"
                                                    )
                                                        acc.notPaid++;
                                                    else acc.vacant++;
                                                    return acc;
                                                },
                                                {
                                                    total: 0,
                                                    paid: 0,
                                                    partial: 0,
                                                    notPaid: 0,
                                                    vacant: 0,
                                                }
                                            );

                                        return (
                                            <>
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-foreground">
                                                        Total Villas:
                                                    </span>
                                                    <span className="font-semibold">
                                                        {stats.total}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-green-600">
                                                        Fully Paid:
                                                    </span>
                                                    <span className="font-semibold text-green-600">
                                                        {stats.paid}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-yellow-600">
                                                        Partially Paid:
                                                    </span>
                                                    <span className="font-semibold text-yellow-600">
                                                        {stats.partial}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-red-600">
                                                        Not Paid:
                                                    </span>
                                                    <span className="font-semibold text-red-600">
                                                        {stats.notPaid}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-2">
                                                    <span className="text-gray-600">
                                                        Vacant:
                                                    </span>
                                                    <span className="font-semibold text-gray-600">
                                                        {stats.vacant}
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center">
                                    <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                                    Monthly Expenses Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-foreground">
                                            Total Expenses:
                                        </span>
                                        <span className="font-semibold text-red-600">
                                            {formatCurrency(
                                                reportData.summary.totalExpenses
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-foreground">
                                            Total Transactions:
                                        </span>
                                        <span className="font-semibold">
                                            {reportData.expenses?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Expenses Table */}
                    {reportData.expenses && reportData.expenses.length > 0 && (
                        <Card className="border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-foreground flex items-center">
                                    <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                                    Expense Details
                                </CardTitle>
                                <CardDescription>
                                    Detailed breakdown of all expenses for this month
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-gray-200 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="font-semibold text-foreground">
                                                    Category
                                                </TableHead>
                                                <TableHead className="font-semibold text-foreground">
                                                    Description
                                                </TableHead>
                                                <TableHead className="font-semibold text-foreground">
                                                    Amount
                                                </TableHead>
                                                <TableHead className="font-semibold text-foreground">
                                                    Date
                                                </TableHead>
                                                <TableHead className="font-semibold text-foreground">
                                                    Payment Method
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.expenses.map((expense: any) => (
                                                <TableRow key={expense.id} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium">
                                                        {expense.category}
                                                    </TableCell>
                                                    <TableCell>
                                                        {expense.description || '-'}
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-red-600">
                                                        {formatCurrency(parseFloat(expense.amount))}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(expense.expenseDate).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {expense.paymentMethod}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Initial State Message */}
            {!reportData && !loading && (
                <Card className="border-gray-200">
                    <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No Report Generated
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Select a month and year, then click "Generate
                            Report" to view the financial summary.
                        </p>
                        <Button
                            onClick={handleGenerateReport}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report for {months[selectedMonth - 1]}{" "}
                            {selectedYear}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
