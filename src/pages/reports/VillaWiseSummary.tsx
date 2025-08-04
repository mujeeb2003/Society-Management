import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Home, 
    Download, 
    FileText, 
    ArrowLeft,
    Search,
    Filter,
    Eye,
    User,
    Calendar,
    DollarSign
} from "lucide-react";
import { getVillas, getPaymentHeads } from "@/redux/user/userSlice";
import type { AppDispatch, RootState } from "@/types";

interface VillaPayment {
    payment_id: number;
    payment_head_id: number;
    payment_head_name: string;
    payment_head_amount: number;
    amount_paid: number;
    pending_amount: number;
    payment_date: string;
    payment_month: number;
    payment_year: number;
    is_recurring: boolean;
}

interface VillaSummary {
    villa_id: number;
    villa_number: string;
    resident_name: string;
    occupancy_type: string;
    total_paid: number;
    total_pending: number;
    payment_history: VillaPayment[];
}

interface VillaWiseSummaryProps {
    onBack: () => void;
}

export default function VillaWiseSummary({ onBack }: VillaWiseSummaryProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { villas, paymentHeads } = useSelector((state: RootState) => state.user);
    
    const [villaSummary, setVillaSummary] = useState<VillaSummary | null>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [selectedVilla, setSelectedVilla] = useState("");
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
    const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");

    // Load initial data
    useEffect(() => {
        dispatch(getVillas());
        dispatch(getPaymentHeads());
    }, [dispatch]);

    // Generate year options (current year and past 3 years)
    const getYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = 0; i < 4; i++) {
            years.push((currentYear - i).toString());
        }
        return years;
    };

    const fetchVillaSummary = async () => {
        if (!selectedVilla) {
            alert("Please select a villa");
            return;
        }

        setReportLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(
                `${API_URL}/reports/villa-summary?villaId=${selectedVilla}&year=${yearFilter}&paymentType=${paymentTypeFilter}`
            );
            const data = await response.json();
            
            if (data.message === "success") {
                setVillaSummary(data.data);
            } else {
                console.error("Error fetching villa summary:", data.error);
                setVillaSummary(null);
            }
        } catch (error) {
            console.error("Error fetching villa summary:", error);
            setVillaSummary(null);
        } finally {
            setReportLoading(false);
        }
    };

    const exportToPDF = async () => {
        if (!selectedVilla) return;
        
        try {
            const API_URL = import.meta.env.VITE_API_URL || "/api";
            const queryParams = new URLSearchParams({
                villaId: selectedVilla,
                year: yearFilter,
                paymentType: paymentTypeFilter,
                format: 'pdf'
            });

            const response = await fetch(`${API_URL}/reports/villa-export?${queryParams}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `villa-${villaSummary?.villa_number}-summary-${yearFilter}.pdf`;
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

    const exportToCSV = async () => {
        if (!selectedVilla) return;
        
        try {
            const API_URL = import.meta.env.VITE_API_URL || "/api";
            const queryParams = new URLSearchParams({
                villaId: selectedVilla,
                year: yearFilter,
                paymentType: paymentTypeFilter,
                format: 'csv'
            });

            const response = await fetch(`${API_URL}/reports/villa-export?${queryParams}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `villa-${villaSummary?.villa_number}-summary-${yearFilter}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error("Error exporting CSV");
            }
        } catch (error) {
            console.error("Error exporting CSV:", error);
        }
    };

    const formatCurrency = (amount: number) => {
        return `PKR ${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const getSelectedVillaInfo = () => {
        return villas.find(villa => villa.id.toString() === selectedVilla);
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
                            <Home className="h-8 w-8 mr-3 text-green-400" />
                            Villa-wise Summary Report
                        </h1>
                        <p className="text-gray-300 mt-1">
                            Complete payment history and analysis for individual villas
                        </p>
                    </div>
                </div>
                <Badge className="bg-green-600/20 text-green-400 border-green-500/30 px-3 py-1">
                    <FileText className="h-4 w-4 mr-1" />
                    Popular Report
                </Badge>
            </div>

            {/* Filters Card */}
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-white flex items-center">
                        <Filter className="h-5 w-5 mr-2 text-green-400" />
                        Villa Selection & Filters
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                        Select a villa and configure filters for the summary report
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Villa Selection */}
                    <div className="space-y-2">
                        <Label className="text-white">Select Villa *</Label>
                        <Select value={selectedVilla} onValueChange={setSelectedVilla}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                <SelectValue placeholder="Choose a villa to generate report" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                                {villas.map((villa) => (
                                    <SelectItem key={villa.id} value={villa.id.toString()} className="text-white">
                                        Villa {villa.villa_number} - {villa.resident_name} ({villa.occupancy_type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white">Year</Label>
                            <Select value={yearFilter} onValueChange={setYearFilter}>
                                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                    <SelectItem value="all" className="text-white">All Years</SelectItem>
                                    {getYearOptions().map((year) => (
                                        <SelectItem key={year} value={year} className="text-white">
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-white">Payment Type</Label>
                            <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
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
                            onClick={fetchVillaSummary}
                            disabled={reportLoading || !selectedVilla}
                            className="bg-green-600 hover:bg-green-500 text-white"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            {reportLoading ? "Loading..." : "Generate Villa Report"}
                        </Button>
                        
                        {villaSummary && (
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={exportToPDF}
                                    className="border-green-600/50 text-green-400 hover:bg-green-600/10"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export PDF
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={exportToCSV}
                                    className="border-blue-600/50 text-blue-400 hover:bg-blue-600/10"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Villa Summary Card */}
            {villaSummary && (
                <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-semibold text-white flex items-center">
                                    <User className="h-5 w-5 mr-2 text-green-400" />
                                    Villa {villaSummary.villa_number} - {villaSummary.resident_name}
                                </CardTitle>
                                <CardDescription className="text-gray-300">
                                    {villaSummary.occupancy_type} • {villaSummary.payment_history.length} payment records
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Badge className="bg-green-600/20 text-green-400 border-green-500/30 px-3 py-2">
                                    
                                    {/* <DollarSign className="h-4 w-4 mr-1" /> */}
                                    PKR Paid: {formatCurrency(villaSummary.total_paid)}
                                </Badge>
                                <Badge className="bg-red-600/20 text-red-400 border-red-500/30 px-3 py-2">
                                    Pending: {formatCurrency(villaSummary.total_pending)}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Payment History Table */}
                        <div className="rounded-lg border border-gray-700 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-800/50">
                                        <TableHead className="text-gray-300">Date</TableHead>
                                        <TableHead className="text-gray-300">Payment Type</TableHead>
                                        <TableHead className="text-gray-300">Month/Year</TableHead>
                                        <TableHead className="text-gray-300 text-right">Required Amount</TableHead>
                                        <TableHead className="text-gray-300 text-right">Amount Paid</TableHead>
                                        <TableHead className="text-gray-300 text-right">Pending</TableHead>
                                        <TableHead className="text-gray-300 text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {villaSummary.payment_history.map((payment, index) => (
                                        <TableRow key={index} className="hover:bg-gray-800/30">
                                            <TableCell className="text-gray-300">
                                                {payment.payment_date ? formatDate(payment.payment_date) : "-"}
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                {payment.payment_head_name}
                                            </TableCell>
                                            <TableCell className="text-gray-300">
                                                {payment.payment_month ? `${payment.payment_month}/${payment.payment_year}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-gray-300 text-right">
                                                {formatCurrency(payment.payment_head_amount)}
                                            </TableCell>
                                            <TableCell className="text-green-400 font-medium text-right">
                                                {formatCurrency(payment.amount_paid || 0)}
                                            </TableCell>
                                            <TableCell className="text-red-400 font-medium text-right">
                                                {formatCurrency(payment.pending_amount)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={
                                                    payment.pending_amount <= 0 
                                                        ? "bg-green-600/20 text-green-400 border-green-500/30"
                                                        : payment.amount_paid > 0
                                                        ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30"
                                                        : "bg-red-600/20 text-red-400 border-red-500/30"
                                                }>
                                                    {payment.pending_amount <= 0 ? "Paid" : 
                                                     payment.amount_paid > 0 ? "Partial" : "Unpaid"}
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

            {/* No Results */}
            {!reportLoading && !villaSummary && selectedVilla && (
                <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                        <Home className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-300 mb-2">No Payment Data Found</h3>
                        <p className="text-gray-400">
                            No payment records were found for the selected villa and filters.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Instructions */}
            {!selectedVilla && (
                <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                        <Home className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Select a Villa to Begin</h3>
                        <p className="text-gray-300 mb-4">
                            Choose a villa from the dropdown above to generate a comprehensive payment summary report.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                            <div>
                                <Calendar className="h-5 w-5 mx-auto mb-2 text-green-400" />
                                <p>Payment History</p>
                            </div>
                            <div>
                                <p>PKR</p>
                                {/* <DollarSign className="h-5 w-5 mx-auto mb-2 text-green-400" /> */}
                                <p>Amount Analysis</p>
                            </div>
                            <div>
                                <Eye className="h-5 w-5 mx-auto mb-2 text-green-400" />
                                <p>Status Overview</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
