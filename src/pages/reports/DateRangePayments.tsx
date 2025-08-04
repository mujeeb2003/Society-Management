import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    CalendarDays, 
    Download, 
    FileText, 
    ArrowLeft,
    Search,
    Filter,
    Eye
} from "lucide-react";
import { getVillas, getPaymentHeads } from "@/redux/user/userSlice";
import type { AppDispatch, RootState, } from "@/types"

interface Payment {
    payment_id: number;
    villa_id: number;
    payment_head_id: number;
    amount: number;
    payment_date: string;
    payment_month: number;
    payment_year: number;
    villa_number: string;
    resident_name: string;
    occupancy_type: string;
    payment_head_name: string;
    payment_head_description: string;
    payment_head_amount: number;
    is_recurring: boolean;
}

interface DateRangePaymentsProps {
    onBack: () => void;
}

export default function DateRangePayments({ onBack }: DateRangePaymentsProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { villas, paymentHeads,  } = useSelector((state: RootState) => state.user);
    
    const [payments, setPayments] = useState<Payment[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedVilla, setSelectedVilla] = useState("all");
    const [selectedPaymentHead, setSelectedPaymentHead] = useState("all");

    // Load initial data
    useEffect(() => {
        // Dispatch Redux actions to fetch data
        dispatch(getVillas());
        dispatch(getPaymentHeads());
        
        // Set default date range (current month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, [dispatch]);

    const fetchPayments = async () => {
        if (!startDate || !endDate) {
            alert("Please select both start and end dates");
            return;
        }

        setReportLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(`${API_URL}/payments/date-range?startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            
            if (data.message === "success") {
                setPayments(data.data);
                applyFilters(data.data);
            } else {
                console.error("Error fetching payments:", data.error);
                setPayments([]);
                setFilteredPayments([]);
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            setPayments([]);
            setFilteredPayments([]);
        } finally {
            setReportLoading(false);
        }
    };

    const applyFilters = (paymentsData: Payment[] = payments) => {
        let filtered = [...paymentsData];

        if (selectedVilla !== "all") {
            filtered = filtered.filter(payment => payment.villa_id.toString() === selectedVilla);
        }

        if (selectedPaymentHead !== "all") {
            filtered = filtered.filter(payment => payment.payment_head_id.toString() === selectedPaymentHead);
        }

        setFilteredPayments(filtered);
    };

    // Apply filters when filter criteria change
    useEffect(() => {
        applyFilters();
    }, [selectedVilla, selectedPaymentHead, payments]);

    const exportToPDF = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || "/api";
            const queryParams = new URLSearchParams({
                startDate,
                endDate,
                villa: selectedVilla,
                paymentHead: selectedPaymentHead,
                format: 'pdf'
            });

            const response = await fetch(`${API_URL}/reports/date-range?${queryParams}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payments-${startDate}-to-${endDate}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error("Error exporting PDF");
            }
        } catch (error) {
            console.error("Error exporting PDF:", error);
        }
    };

    const exportToExcel = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || "/api";
            const queryParams = new URLSearchParams({
                startDate,
                endDate,
                villa: selectedVilla,
                paymentHead: selectedPaymentHead,
                format: 'excel'
            });

            const response = await fetch(`${API_URL}/reports/date-range?${queryParams}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payments-${startDate}-to-${endDate}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error("Error exporting Excel");
            }
        } catch (error) {
            console.error("Error exporting Excel:", error);
        }
    };

    const getTotalAmount = () => {
        return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    };

    const formatCurrency = (amount: number) => {
        return `PKR ${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button 
                        variant="outline" 
                        onClick={onBack}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Reports
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center">
                            <CalendarDays className="h-8 w-8 mr-3 text-blue-400" />
                            Date Range Payments Report
                        </h1>
                        <p className="text-gray-300 mt-1">
                            Export payment transactions within a specific date range
                        </p>
                    </div>
                </div>
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 px-3 py-1">
                    <FileText className="h-4 w-4 mr-1" />
                    Essential Report
                </Badge>
            </div>

            {/* Filters Card */}
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-white flex items-center">
                        <Filter className="h-5 w-5 mr-2 text-blue-400" />
                        Report Filters
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                        Configure your report parameters and date range
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate" className="text-white">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-gray-800 border-gray-600 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate" className="text-white">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-gray-800 border-gray-600 text-white"
                            />
                        </div>
                    </div>

                    {/* Additional Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white">Villa</Label>
                            <Select value={selectedVilla} onValueChange={setSelectedVilla}>
                                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select villa" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                    <SelectItem value="all" className="text-white">All Villas</SelectItem>
                                    {villas.map((villa) => (
                                        <SelectItem key={villa.id} value={villa.id.toString()} className="text-white">
                                            Villa {villa.villa_number} - {villa.resident_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Payment Type</Label>
                            <Select value={selectedPaymentHead} onValueChange={setSelectedPaymentHead}>
                                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                    <SelectItem value="all" className="text-white">All Payment Types</SelectItem>
                                    {paymentHeads.map((head) => (
                                        <SelectItem key={head.id} value={head.id.toString()} className="text-white">
                                            {head.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <Button 
                            onClick={fetchPayments}
                            disabled={reportLoading || !startDate || !endDate}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            {reportLoading ? "Loading..." : "Generate Report"}
                        </Button>
                        
                        {filteredPayments.length > 0 && (
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={exportToPDF}
                                    className="border-blue-600/50 text-blue-400 hover:bg-blue-600/10"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export PDF
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={exportToExcel}
                                    className="border-green-600/50 text-green-400 hover:bg-green-600/10"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {filteredPayments.length > 0 && (
                <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-semibold text-white flex items-center">
                                    <Eye className="h-5 w-5 mr-2 text-green-400" />
                                    Payment Results
                                </CardTitle>
                                <CardDescription className="text-gray-300">
                                    {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found for the selected period
                                </CardDescription>
                            </div>
                            <Badge className="bg-green-600/20 text-green-400 border-green-500/30 px-3 py-2">
                                Total: {formatCurrency(getTotalAmount())}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border border-gray-700 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-800/50">
                                        <TableHead className="text-gray-300">Payment ID</TableHead>
                                        <TableHead className="text-gray-300">Date</TableHead>
                                        <TableHead className="text-gray-300">Villa</TableHead>
                                        <TableHead className="text-gray-300">Resident</TableHead>
                                        <TableHead className="text-gray-300">Payment Type</TableHead>
                                        <TableHead className="text-gray-300 text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.map((payment) => (
                                        <TableRow key={payment.payment_id} className="hover:bg-gray-800/30">
                                            <TableCell className="text-blue-400 font-mono">
                                                #{String(payment.payment_id).padStart(8, '0')}
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                {formatDate(payment.payment_date)}
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                Villa {payment.villa_number}
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                {payment.resident_name}
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                {payment.payment_head_name}
                                            </TableCell>
                                            <TableCell className="text-green-400 font-medium text-right">
                                                {formatCurrency(payment.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No Results */}
            {!reportLoading && payments.length === 0 && startDate && endDate && (
                <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                        <CalendarDays className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-300 mb-2">No Payments Found</h3>
                        <p className="text-gray-400">
                            No payment transactions were found for the selected date range and filters.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
