import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Download,
    ArrowRight,
    BarChart3,
    TrendingUp,
    Home,
    AlertTriangle,
} from "lucide-react";
import MonthlyReport from "./reports/MonthlyReport";
import VillaWiseReport from "./reports/VillaWiseReport";
import PendingPaymentsReport from "./reports/PendingPaymentsReport";

export default function Reports() {
    const [currentView, setCurrentView] = useState<string>("main");

    const handleReportSelect = (reportId: string) => {
        setCurrentView(reportId);
    };

    const handleBackToMain = () => {
        setCurrentView("main");
    };

    // Render Monthly Report component
    if (currentView === "monthly-report") {
        return <MonthlyReport onBack={handleBackToMain} />;
    }

    // Render Villa-wise Report component
    if (currentView === "villa-report") {
        return <VillaWiseReport onBack={handleBackToMain} />;
    }

    // Render Pending Payments Report component
    if (currentView === "pending-payments") {
        return <PendingPaymentsReport onBack={handleBackToMain} />;
    }

    // Main reports dashboard
    return (
        <div className="p-6 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">
                            Reports & Analytics
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Generate comprehensive financial reports for your
                            society management
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="px-3 py-1">
                            <FileText className="h-4 w-4 mr-1" />
                            Monthly Report Available
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Featured Report - Monthly Report */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100">
                                <BarChart3 className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-foreground">
                                    Monthly Financial Report
                                </CardTitle>
                                <CardDescription className="text-blue-600 text-lg">
                                    Comprehensive monthly financial analysis and
                                    villa-wise payment breakdown
                                </CardDescription>
                                <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200">
                                    Available Now
                                </Badge>
                            </div>
                        </div>
                        <Button
                            onClick={() => handleReportSelect("monthly-report")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
                        >
                            Generate Report
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground mb-4">
                        Get a complete financial overview including:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-blue-700">
                                Financial Summary
                            </div>
                            <div className="text-sm text-blue-600">
                                Previous balance, receipts, expenses
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-blue-700">
                                Villa-wise Payments
                            </div>
                            <div className="text-sm text-blue-600">
                                Detailed payment status per villa
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-blue-700">
                                Payment Statistics
                            </div>
                            <div className="text-sm text-blue-600">
                                Paid, pending, partial breakdown
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-blue-700">
                                Expense Analysis
                            </div>
                            <div className="text-sm text-blue-600">
                                Monthly expense categorization
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="bg-white">
                            <Download className="h-3 w-3 mr-1" />
                            Excel Export
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                            <FileText className="h-3 w-3 mr-1" />
                            Professional Layout
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Financial Analysis
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Villa-wise Report Card */}
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-100">
                                <Home className="h-8 w-8 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-foreground">
                                    Villa-wise Report
                                </CardTitle>
                                <CardDescription className="text-purple-600 text-lg">
                                    Complete payment history for a specific villa
                                </CardDescription>
                                <Badge className="mt-2 bg-purple-100 text-purple-700 border-purple-200">
                                    Available Now
                                </Badge>
                            </div>
                        </div>
                        <Button
                            onClick={() => handleReportSelect("villa-report")}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-lg"
                        >
                            Generate Report
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground mb-4">
                        Get a comprehensive payment report for any villa including:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-purple-700">
                                Villa Information
                            </div>
                            <div className="text-sm text-purple-600">
                                Villa details and resident info
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-purple-700">
                                Monthly Breakdown
                            </div>
                            <div className="text-sm text-purple-600">
                                Payment details for each month
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-purple-700">
                                Overall Totals
                            </div>
                            <div className="text-sm text-purple-600">
                                Total receivable, received, pending
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-purple-700">
                                Payment Statistics
                            </div>
                            <div className="text-sm text-purple-600">
                                Paid, partial, unpaid months
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="bg-white">
                            <Download className="h-3 w-3 mr-1" />
                            Excel Export
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                            <Home className="h-3 w-3 mr-1" />
                            Villa Specific
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Complete History
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Pending Payments Report Card */}
            <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-100">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-foreground">
                                    Pending Payments Report
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Track all villas with outstanding payments
                                </CardDescription>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Quickly identify and follow up on pending payments
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => handleReportSelect("pending-payments")}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg"
                        >
                            Generate Report
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground mb-4">
                        Get a comprehensive list of all pending payments including:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-red-700">
                                Villa Details
                            </div>
                            <div className="text-sm text-red-600">
                                Number, resident name, occupancy
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-red-700">
                                Payment Breakdown
                            </div>
                            <div className="text-sm text-red-600">
                                Receivable, received, pending amounts
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-red-700">
                                Category Details
                            </div>
                            <div className="text-sm text-red-600">
                                Payment head-wise pending
                            </div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg">
                            <div className="font-semibold text-red-700">
                                Summary Statistics
                            </div>
                            <div className="text-sm text-red-600">
                                Total pending, unpaid vs partial
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="bg-white">
                            <Download className="h-3 w-3 mr-1" />
                            Excel Export
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Payment Tracking
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Monthly Overview
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions Section */}
            <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-600" />
                        Quick Report Generation
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Generate reports for common time periods with a single
                        click.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                            variant="outline"
                            className="justify-start h-auto p-4 bg-white hover:bg-blue-50 transition-all duration-300"
                            onClick={() => handleReportSelect("monthly-report")}
                        >
                            <div className="text-left">
                                <div className="font-medium text-foreground">
                                    Current Month Report
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {new Date().toLocaleDateString("en-US", {
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="justify-start h-auto p-4 bg-white hover:bg-blue-50 transition-all duration-300"
                            onClick={() => handleReportSelect("monthly-report")}
                        >
                            <div className="text-left">
                                <div className="font-medium text-foreground">
                                    Previous Month Report
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {new Date(
                                        new Date().setMonth(
                                            new Date().getMonth() - 1
                                        )
                                    ).toLocaleDateString("en-US", {
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="justify-start h-auto p-4 bg-white hover:bg-blue-50 transition-all duration-300"
                            onClick={() => handleReportSelect("monthly-report")}
                        >
                            <div className="text-left">
                                <div className="font-medium text-foreground">
                                    Custom Report
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Choose any month & year
                                </div>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="border-gray-200">
                <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-xl bg-blue-50">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-2">
                                How to Use Monthly Reports
                            </h3>
                            <p className="text-muted-foreground mb-3">
                                Select any month and year to generate a
                                comprehensive financial report. The report
                                includes financial summaries, villa-wise payment
                                details, statistics, and expense analysis. All
                                reports can be exported to Excel for further
                                analysis or record-keeping.
                            </p>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                                <span>• Villa payment status tracking</span>
                                <span>• Financial balance calculations</span>
                                <span>• Expense categorization</span>
                                <span>• Excel export capability</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
