import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    DollarSign,
    Download,
    FileText,
    ArrowLeft,
    Search,
    Filter,
    Eye,
    TrendingUp,
    TrendingDown,
    Calendar,
    BarChart3,
    PieChart,
    Activity,
} from "lucide-react";
import { getPaymentHeads } from "@/redux/user/userSlice";
import type { AppDispatch, RootState } from "@/types";

interface MonthlyBreakdown {
    month: number;
    year: number;
    amount_collected: number;
    transactions_count: number;
}

interface PaymentHeadAnalysis {
    payment_head_id: number;
    payment_head_name: string;
    payment_head_description: string;
    payment_head_amount: number;
    is_recurring: boolean;
    total_collected: number;
    total_pending: number;
    collection_rate: number;
    total_villas: number;
    paid_villas: number;
    unpaid_villas: number;
    partially_paid_villas: number;
    monthly_breakdown: MonthlyBreakdown[];
}

interface OverallStats {
    total_revenue: number;
    total_pending: number;
    overall_collection_rate: number;
    active_payment_heads: number;
}

interface PaymentHeadReportsData {
    overall_stats: OverallStats;
    payment_heads: PaymentHeadAnalysis[];
    date_range: {
        start_date: string;
        end_date: string;
    };
}

interface PaymentHeadReportsProps {
    onBack: () => void;
}

const PaymentHeadReports: React.FC<PaymentHeadReportsProps> = ({ onBack }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { paymentHeads } = useSelector((state: RootState) => state.user);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedPaymentHead, setSelectedPaymentHead] = useState("all");
    const [reportData, setReportData] = useState<PaymentHeadReportsData | null>(
        null
    );
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"overview" | "detailed">(
        "overview"
    );

    useEffect(() => {
        dispatch(getPaymentHeads());

        // Set default date range (current month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setStartDate(firstDay.toISOString().split("T")[0]);
        setEndDate(lastDay.toISOString().split("T")[0]);
    }, [dispatch]);

    const fetchReportData = async () => {
        if (!startDate || !endDate) {
            alert("Please select both start and end dates");
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                paymentHead: selectedPaymentHead,
            });
            const API_URL = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(
                `${API_URL}/reports/payment-heads?${params}`
            );
            const result = await response.json();

            if (result.message === "success") {
                setReportData(result.data);
            } else {
                alert("Error fetching report data: " + result.error);
            }
        } catch (error) {
            console.error("Error fetching payment head reports:", error);
            alert("Error fetching report data");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: "pdf" | "csv") => {
        if (!reportData) {
            alert("Please generate the report first");
            return;
        }

        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                paymentHead: selectedPaymentHead,
                format,
            });
            const API_URL = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(
                `${API_URL}/reports/payment-heads-export?${params}`
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;
                a.download = `payment-heads-analysis-${startDate}-to-${endDate}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert("Error exporting report");
            }
        } catch (error) {
            console.error("Error exporting report:", error);
            alert("Error exporting report");
        }
    };

    const formatCurrency = (amount: number) => {
        return `PKR ${amount.toLocaleString()}`;
    };

    const getCollectionRateColor = (rate: number) => {
        if (rate >= 80) return "text-green-400";
        if (rate >= 60) return "text-yellow-400";
        return "text-red-400";
    };

    const getCollectionRateBadge = (rate: number) => {
        if (rate >= 80)
            return "bg-green-500/20 text-green-400 border-green-500/30";
        if (rate >= 60)
            return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        return "bg-red-500/20 text-red-400 border-red-500/30";
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Reports
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                Payment Head Reports
                            </h1>
                            <p className="text-gray-400">
                                Analyze revenue and collection performance by
                                payment categories
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-purple-400 flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Analysis Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label
                                    htmlFor="startDate"
                                    className="text-gray-300"
                                >
                                    Start Date
                                </Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="bg-gray-700 border-gray-600 text-gray-100"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="endDate"
                                    className="text-gray-300"
                                >
                                    End Date
                                </Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-gray-700 border-gray-600 text-gray-100"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="paymentHead"
                                    className="text-gray-300"
                                >
                                    Payment Head
                                </Label>
                                <Select
                                    value={selectedPaymentHead}
                                    onValueChange={setSelectedPaymentHead}
                                >
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-600">
                                        <SelectItem
                                            value="all"
                                            className="text-gray-100"
                                        >
                                            All Payment Heads
                                        </SelectItem>
                                        {paymentHeads.map((head: any) => (
                                            <SelectItem
                                                key={head.id}
                                                value={head.id.toString()}
                                                className="text-gray-100"
                                            >
                                                {head.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={fetchReportData}
                                    disabled={loading}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    {loading
                                        ? "Generating..."
                                        : "Generate Report"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Overall Statistics */}
                {reportData && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-400 text-sm font-medium">
                                                Total Revenue
                                            </p>
                                            <p className="text-2xl font-bold text-white">
                                                {formatCurrency(
                                                    reportData.overall_stats
                                                        .total_revenue
                                                )}
                                            </p>
                                        </div>
                                        <TrendingUp className="w-8 h-8 text-green-400" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-red-400 text-sm font-medium">
                                                Total Pending
                                            </p>
                                            <p className="text-2xl font-bold text-white">
                                                {formatCurrency(
                                                    reportData.overall_stats
                                                        .total_pending
                                                )}
                                            </p>
                                        </div>
                                        <TrendingDown className="w-8 h-8 text-red-400" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-400 text-sm font-medium">
                                                Collection Rate
                                            </p>
                                            <p
                                                className={`text-2xl font-bold ${getCollectionRateColor(
                                                    reportData.overall_stats
                                                        .overall_collection_rate
                                                )}`}
                                            >
                                                {reportData.overall_stats.overall_collection_rate.toFixed(
                                                    1
                                                )}
                                                %
                                            </p>
                                        </div>
                                        <Activity className="w-8 h-8 text-blue-400" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-400 text-sm font-medium">
                                                Active Heads
                                            </p>
                                            <p className="text-2xl font-bold text-white">
                                                {
                                                    reportData.overall_stats
                                                        .active_payment_heads
                                                }
                                            </p>
                                        </div>
                                        <DollarSign className="w-8 h-8 text-purple-400" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* View Mode Toggle & Export */}
                        <div className="flex justify-between items-center">
                            <div className="flex space-x-2">
                                <Button
                                    variant={
                                        viewMode === "overview"
                                            ? "default"
                                            : "ghost"
                                    }
                                    onClick={() => setViewMode("overview")}
                                    className={
                                        viewMode === "overview"
                                            ? "bg-purple-600 hover:bg-purple-700"
                                            : "text-gray-400 hover:text-white"
                                    }
                                >
                                    Overview
                                </Button>
                                <Button
                                    variant={
                                        viewMode === "detailed"
                                            ? "default"
                                            : "ghost"
                                    }
                                    onClick={() => setViewMode("detailed")}
                                    className={
                                        viewMode === "detailed"
                                            ? "bg-purple-600 hover:bg-purple-700"
                                            : "text-gray-400 hover:text-white"
                                    }
                                >
                                    Detailed Analysis
                                </Button>
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleExport("csv")}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export CSV
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleExport("pdf")}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Export PDF
                                </Button>
                            </div>
                        </div>

                        {/* Payment Heads Analysis */}
                        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-purple-400" />
                                    Payment Heads Analysis
                                </CardTitle>
                                <CardDescription className="text-gray-400">
                                    Detailed breakdown of collection performance
                                    by payment category
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-gray-700">
                                                <TableHead className="text-left text-gray-300">
                                                    Payment Head
                                                </TableHead>
                                                <TableHead className="text-right text-gray-300">
                                                    Expected
                                                </TableHead>
                                                <TableHead className="text-right text-gray-300">
                                                    Collected
                                                </TableHead>
                                                <TableHead className="text-right text-gray-300">
                                                    Pending
                                                </TableHead>
                                                <TableHead className="text-center text-gray-300">
                                                    Rate
                                                </TableHead>
                                                <TableHead className="text-center text-gray-300">
                                                    Status
                                                </TableHead>
                                                {viewMode === "detailed" && (
                                                    <>
                                                        <TableHead className="text-center text-gray-300">
                                                            Paid
                                                        </TableHead>
                                                        <TableHead className="text-center text-gray-300">
                                                            Partial
                                                        </TableHead>
                                                        <TableHead className="text-center text-gray-300">
                                                            Unpaid
                                                        </TableHead>
                                                    </>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.payment_heads.map(
                                                (head) => {
                                                    const expectedAmount =
                                                        head.total_villas *
                                                        head.payment_head_amount;
                                                    return (
                                                        <TableRow
                                                            key={
                                                                head.payment_head_id
                                                            }
                                                            className="border-b border-gray-800 hover:bg-gray-700/30"
                                                        >
                                                            <TableCell className="p-3">
                                                                <div>
                                                                    <div className="font-medium text-white">
                                                                        {
                                                                            head.payment_head_name
                                                                        }
                                                                    </div>
                                                                    <div className="text-sm text-gray-400">
                                                                        {
                                                                            head.payment_head_description
                                                                        }
                                                                    </div>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="mt-1 text-xs"
                                                                    >
                                                                        {head.is_recurring
                                                                            ? "Recurring"
                                                                            : "One-time"}
                                                                    </Badge>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="p-3 text-right text-gray-300">
                                                                {formatCurrency(
                                                                    expectedAmount
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="p-3 text-right text-green-400 font-medium">
                                                                {formatCurrency(
                                                                    head.total_collected
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="p-3 text-right text-red-400 font-medium">
                                                                {formatCurrency(
                                                                    head.total_pending
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="p-3 text-center">
                                                                <Badge
                                                                    className={getCollectionRateBadge(
                                                                        head.collection_rate
                                                                    )}
                                                                >
                                                                    {head.collection_rate.toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="p-3 text-center">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {
                                                                        head.total_villas
                                                                    }{" "}
                                                                    villas
                                                                </Badge>
                                                            </TableCell>
                                                            {viewMode ===
                                                                "detailed" && (
                                                                <>
                                                                    <TableCell className="p-3 text-center text-green-400">
                                                                        {
                                                                            head.paid_villas
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="p-3 text-center text-yellow-400">
                                                                        {
                                                                            head.partially_paid_villas
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="p-3 text-center text-red-400">
                                                                        {
                                                                            head.unpaid_villas
                                                                        }
                                                                    </TableCell>
                                                                </>
                                                            )}
                                                        </TableRow>
                                                    );
                                                }
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {!reportData && !loading && (
                    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                No Report Generated
                            </h3>
                            <p className="text-gray-500">
                                Select your filters and click "Generate Report"
                                to view payment head analysis
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default PaymentHeadReports;
