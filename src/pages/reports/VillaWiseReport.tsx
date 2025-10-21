import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/types";
import {
    generateVillaReport,
    exportVillaReport,
    getVillas,
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
    Calendar,
    CheckCircle2,
    AlertCircle,
    Clock,
} from "lucide-react";
import { VillaReport as VillaReportType } from "@/types";

interface VillaWiseReportProps {
    onBack: () => void;
}

export default function VillaWiseReport({ onBack }: VillaWiseReportProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { toast } = useToast();
    const { villas } = useSelector((state: RootState) => state.user);

    const [selectedVillaId, setSelectedVillaId] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<number>(
        new Date().getFullYear()
    );
    const [reportData, setReportData] = useState<VillaReportType | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(getVillas());
    }, [dispatch]);

    const handleGenerateReport = async () => {
        if (!selectedVillaId) {
            toast({
                title: "Error",
                description: "Please select a villa",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const result = await dispatch(
                generateVillaReport({
                    villaId: parseInt(selectedVillaId),
                    year: selectedYear,
                })
            ).unwrap();

            setReportData(result.data);
            toast({
                title: "Report Generated",
                description: `Villa-wise report for ${result.data.villa.villaNumber} generated successfully`,
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
                exportVillaReport({
                    villaId: reportData.villa.id,
                    year: selectedYear,
                })
            ).unwrap();

            toast({
                title: "Export Successful",
                description: "Villa report exported to Excel successfully",
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

    const formatCurrency = (amount: number) =>
        `PKR ${amount.toLocaleString()}`;

    const getStatusBadge = (status: string) => {
        const variants = {
            paid: "bg-green-100 text-green-800 border-green-200",
            partial: "bg-yellow-100 text-yellow-800 border-yellow-200",
            unpaid: "bg-red-100 text-red-800 border-red-200",
        };

        const icons = {
            paid: <CheckCircle2 className="h-3 w-3 mr-1" />,
            partial: <Clock className="h-3 w-3 mr-1" />,
            unpaid: <AlertCircle className="h-3 w-3 mr-1" />,
        };

        return (
            <Badge
                className={
                    variants[status as keyof typeof variants] || variants.unpaid
                }
            >
                {icons[status as keyof typeof icons]}
                {status.toUpperCase()}
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
                            Villa-wise Annual Report
                        </h1>
                        <p className="text-muted-foreground">
                            Complete payment history for a specific villa
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center">
                        <Home className="h-5 w-5 mr-2 text-purple-600" />
                        Report Parameters
                    </CardTitle>
                    <CardDescription>
                        Select the villa and year for which you want to generate
                        the report
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-foreground">
                            Villa
                        </label>
                        <Select
                            value={selectedVillaId}
                            onValueChange={setSelectedVillaId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a villa" />
                            </SelectTrigger>
                            <SelectContent>
                                {villas
                                    .filter((villa) => villa.residentName)
                                    .map((villa) => (
                                        <SelectItem
                                            key={villa.id}
                                            value={villa.id.toString()}
                                        >
                                            {villa.villaNumber} -{" "}
                                            {villa.residentName}
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
                        className="bg-purple-600 hover:bg-purple-700"
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
                    {/* Villa Information */}
                    <Card className="border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center">
                                <Home className="h-5 w-5 mr-2 text-blue-600" />
                                Villa Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="text-sm text-blue-600 font-medium mb-1">
                                        Villa Number
                                    </div>
                                    <div className="text-2xl font-bold text-blue-700">
                                        {reportData.villa.villaNumber}
                                    </div>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="text-sm text-purple-600 font-medium mb-1">
                                        Resident Name
                                    </div>
                                    <div className="text-2xl font-bold text-purple-700">
                                        {reportData.villa.residentName || "N/A"}
                                    </div>
                                </div>

                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                    <div className="text-sm text-indigo-600 font-medium mb-1">
                                        Occupancy Type
                                    </div>
                                    <div className="text-2xl font-bold text-indigo-700">
                                        {reportData.villa.occupancyType}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="text-sm text-gray-600 font-medium mb-1">
                                        Report Year
                                    </div>
                                    <div className="text-2xl font-bold text-gray-700">
                                        {reportData.year}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Yearly Summary */}
                    <Card className="border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                                Yearly Summary - {reportData.year}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="text-sm text-blue-600 font-medium mb-1">
                                        Total Receivable
                                    </div>
                                    <div className="text-2xl font-bold text-blue-700">
                                        {formatCurrency(
                                            reportData.yearlyTotals
                                                .totalReceivable
                                        )}
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="text-sm text-green-600 font-medium mb-1">
                                        Total Received
                                    </div>
                                    <div className="text-2xl font-bold text-green-700 flex items-center">
                                        <TrendingUp className="h-5 w-5 mr-1" />
                                        {formatCurrency(
                                            reportData.yearlyTotals.totalReceived
                                        )}
                                    </div>
                                </div>

                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <div className="text-sm text-red-600 font-medium mb-1">
                                        Total Pending
                                    </div>
                                    <div className="text-2xl font-bold text-red-700 flex items-center">
                                        <TrendingDown className="h-5 w-5 mr-1" />
                                        {formatCurrency(
                                            reportData.yearlyTotals.totalPending
                                        )}
                                    </div>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="text-sm text-purple-600 font-medium mb-1">
                                        Total Payments
                                    </div>
                                    <div className="text-2xl font-bold text-purple-700">
                                        {reportData.yearlyTotals.totalPayments}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="text-3xl font-bold text-green-700 mb-1">
                                        {reportData.paymentStats.paidMonths}
                                    </div>
                                    <div className="text-sm text-green-600">
                                        Fully Paid Months
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="text-3xl font-bold text-yellow-700 mb-1">
                                        {reportData.paymentStats.partialMonths}
                                    </div>
                                    <div className="text-sm text-yellow-600">
                                        Partially Paid Months
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                                    <div className="text-3xl font-bold text-red-700 mb-1">
                                        {reportData.paymentStats.unpaidMonths}
                                    </div>
                                    <div className="text-sm text-red-600">
                                        Unpaid Months
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monthly Payment Details */}
                    <Card className="border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-orange-600" />
                                Monthly Payment Details
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Detailed breakdown of payments by month for{" "}
                                {reportData.year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reportData.monthlyPayments
                                .filter((month) => month.totalReceivable > 0)
                                .map((monthData) => (
                                    <div
                                        key={monthData.month}
                                        className="mb-6 last:mb-0"
                                    >
                                        <div className="bg-gray-50 p-3 rounded-t-lg border-b-2 border-purple-200">
                                            <h3 className="font-semibold text-lg flex items-center justify-between">
                                                <span>{monthData.monthName}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {monthData.payments.length > 0 
                                                        ? `${monthData.payments.length} payment(s)` 
                                                        : 'No payment record'}
                                                </span>
                                            </h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Category
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Receivable
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Received
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Pending
                                                        </TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Method</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Notes</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {monthData.payments.length > 0 ? (
                                                        monthData.payments.map(
                                                            (payment) => (
                                                                <TableRow
                                                                    key={payment.id}
                                                                >
                                                                    <TableCell className="font-medium">
                                                                        {
                                                                            payment.categoryName
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatCurrency(
                                                                            payment.receivableAmount
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-green-600 font-medium">
                                                                        {formatCurrency(
                                                                            payment.receivedAmount
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-red-600 font-medium">
                                                                        {formatCurrency(
                                                                            payment.pendingAmount
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {new Date(
                                                                            payment.paymentDate
                                                                        ).toLocaleDateString()}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {
                                                                            payment.paymentMethod
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {getStatusBadge(
                                                                            payment.paymentStatus
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="max-w-xs truncate">
                                                                        {payment.notes ||
                                                                            "-"}
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        )
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell className="font-medium text-red-600">
                                                                No Payment Made
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(
                                                                    monthData.totalReceivable
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right text-green-600 font-medium">
                                                                {formatCurrency(0)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-red-600 font-medium">
                                                                {formatCurrency(
                                                                    monthData.totalPending
                                                                )}
                                                            </TableCell>
                                                            <TableCell>-</TableCell>
                                                            <TableCell>-</TableCell>
                                                            <TableCell>
                                                                {getStatusBadge('unpaid')}
                                                            </TableCell>
                                                            <TableCell>Payment not received</TableCell>
                                                        </TableRow>
                                                    )}
                                                    <TableRow className="bg-gray-50 font-semibold">
                                                        <TableCell>
                                                            Month Total
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(
                                                                monthData.totalReceivable
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right text-green-600">
                                                            {formatCurrency(
                                                                monthData.totalReceived
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600">
                                                            {formatCurrency(
                                                                monthData.totalPending
                                                            )}
                                                        </TableCell>
                                                        <TableCell
                                                            colSpan={4}
                                                        ></TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                ))}

                            {reportData.monthlyPayments.filter(
                                (month) => month.totalReceivable > 0
                            ).length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    No payment records found for this villa in{" "}
                                    {reportData.year}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Initial State Message */}
            {!reportData && !loading && (
                <Card className="border-gray-200">
                    <CardContent className="text-center py-12">
                        <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No Report Generated
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Select a villa and year, then click "Generate Report"
                            to view the complete payment history.
                        </p>
                        {selectedVillaId && (
                            <Button
                                onClick={handleGenerateReport}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Report for{" "}
                                {
                                    villas.find(
                                        (v) =>
                                            v.id.toString() === selectedVillaId
                                    )?.villaNumber
                                }{" "}
                                - {selectedYear}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
