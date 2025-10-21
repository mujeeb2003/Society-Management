import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, PendingPaymentsReport as PendingPaymentsReportType } from "@/types";
import {
    generatePendingPaymentsReport,
    exportPendingPaymentsReport,
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
    FileText,
    Download,
    AlertTriangle,
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
} from "lucide-react";

interface PendingPaymentsReportProps {
    onBack: () => void;
}

export default function PendingPaymentsReport({ onBack }: PendingPaymentsReportProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { toast } = useToast();

    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(
        currentDate.getMonth() + 1
    );
    const [selectedYear, setSelectedYear] = useState<number>(
        currentDate.getFullYear()
    );
    const [reportData, setReportData] = useState<PendingPaymentsReportType | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedVilla, setExpandedVilla] = useState<number | null>(null);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const result = await dispatch(
                generatePendingPaymentsReport({
                    month: selectedMonth,
                    year: selectedYear,
                })
            ).unwrap();

            setReportData(result.data);
            toast({
                title: "Report Generated",
                description: `Found ${result.data.summary.totalVillasWithPending} villas with pending payments`,
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
                exportPendingPaymentsReport({
                    month: selectedMonth,
                    year: selectedYear,
                })
            ).unwrap();

            toast({
                title: "Export Successful",
                description: "Pending payments report exported to Excel successfully",
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
        if (status === "unpaid") {
            return (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    UNPAID
                </Badge>
            );
        } else {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    PARTIAL
                </Badge>
            );
        }
    };

    const months = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
    ];

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
                            Pending Payments Report
                        </h1>
                        <p className="text-muted-foreground">
                            Overview of all villas with outstanding payments
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-red-600" />
                        Report Parameters
                    </CardTitle>
                    <CardDescription>
                        Select the month and year to view pending payments
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
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((month) => (
                                    <SelectItem
                                        key={month.value}
                                        value={month.value.toString()}
                                    >
                                        {month.label}
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
                        className="bg-red-600 hover:bg-red-700"
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
                    {/* Summary Statistics */}
                    <Card className="border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                                Summary - {reportData.monthName} {reportData.year}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <div className="text-sm text-red-600 font-medium mb-1">
                                        Villas with Pending
                                    </div>
                                    <div className="text-2xl font-bold text-red-700 flex items-center">
                                        <Users className="h-5 w-5 mr-1" />
                                        {reportData.summary.totalVillasWithPending}
                                    </div>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <div className="text-sm text-orange-600 font-medium mb-1">
                                        Total Pending Amount
                                    </div>
                                    <div className="text-2xl font-bold text-orange-700 flex items-center">
                                        {/* <DollarSign className="h-5 w-5 mr-1" /> */}
                                        {formatCurrency(
                                            reportData.summary.totalPendingAmount
                                        )}
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <div className="text-sm text-yellow-600 font-medium mb-1">
                                        Unpaid Villas
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-700">
                                        {reportData.summary.unpaidVillas}
                                    </div>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                    <div className="text-sm text-amber-600 font-medium mb-1">
                                        Partially Paid Villas
                                    </div>
                                    <div className="text-2xl font-bold text-amber-700">
                                        {reportData.summary.partialPaidVillas}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="text-sm text-blue-600 font-medium mb-1">
                                        Total Receivable
                                    </div>
                                    <div className="text-xl font-bold text-blue-700">
                                        {formatCurrency(
                                            reportData.summary.totalReceivableAmount
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Villas List */}
                    <Card className="border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center justify-between">
                                <span className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-red-600" />
                                    Villas with Pending Payments
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {reportData.pendingVillas.length} villa(s)
                                </span>
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Detailed breakdown of pending payments for {reportData.monthName} {reportData.year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reportData.pendingVillas.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Villa#</TableHead>
                                                <TableHead>Resident Name</TableHead>
                                                <TableHead>Occupancy</TableHead>
                                                <TableHead className="text-right">
                                                    Pending Amount
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.pendingVillas.map((villa) => (
                                                <>
                                                    <TableRow key={villa.villaId}>
                                                        <TableCell className="font-medium">
                                                            {villa.villaNumber}
                                                        </TableCell>
                                                        <TableCell>
                                                            {villa.residentName}
                                                        </TableCell>
                                                        <TableCell>
                                                            {villa.occupancyType}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600 font-bold">
                                                            {formatCurrency(
                                                                villa.totalPending
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(
                                                                villa.paymentStatus
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setExpandedVilla(
                                                                        expandedVilla ===
                                                                            villa.villaId
                                                                            ? null
                                                                            : villa.villaId
                                                                    )
                                                                }
                                                            >
                                                                {expandedVilla ===
                                                                villa.villaId
                                                                    ? "Hide Details"
                                                                    : "View Details"}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {expandedVilla === villa.villaId && (
                                                        <TableRow>
                                                            <TableCell
                                                                colSpan={6}
                                                                className="bg-gray-50"
                                                            >
                                                                <div className="p-4">
                                                                    <h4 className="font-semibold mb-2 text-foreground">
                                                                        Payment Category Breakdown:
                                                                    </h4>
                                                                    <div className="space-y-2">
                                                                        {villa.paymentDetails.map(
                                                                            (detail, idx) => (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="flex justify-between items-center bg-white p-3 rounded border"
                                                                                >
                                                                                    <span className="font-medium">
                                                                                        {
                                                                                            detail.categoryName
                                                                                        }
                                                                                    </span>
                                                                                    <div className="flex gap-4 text-sm">
                                                                                        <span>
                                                                                            Receivable:{" "}
                                                                                            {formatCurrency(
                                                                                                detail.receivableAmount
                                                                                            )}
                                                                                        </span>
                                                                                        <span className="text-red-600 font-semibold">
                                                                                            Pending:{" "}
                                                                                            {formatCurrency(
                                                                                                detail.pendingAmount
                                                                                            )}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-lg font-semibold text-foreground mb-2">
                                        No Pending Payments
                                    </h3>
                                    <p>
                                        All villas have cleared their payments for{" "}
                                        {reportData.monthName} {reportData.year}! 🎉
                                    </p>
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
                        <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No Report Generated
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Select a month and year, then click "Generate Report"
                            to view all villas with pending payments.
                        </p>
                        <Button
                            onClick={handleGenerateReport}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report for{" "}
                            {months.find((m) => m.value === selectedMonth)?.label}{" "}
                            {selectedYear}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
