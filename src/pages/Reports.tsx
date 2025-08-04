import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    CalendarDays, 
    Home, 
    DollarSign, 
    AlertTriangle,
    FileText,
    Download,
    ArrowRight
} from "lucide-react";
import DateRangePayments from "./reports/DateRangePayments";
import VillaWiseSummary from "./reports/VillaWiseSummary";
import PaymentHeadReports from "./reports/PaymentHeadReports";

interface ReportCard {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    badge: string;
    badgeColor: string;
    useCase: string;
    exportFormats: string[];
}

const reportTypes: ReportCard[] = [
    {
        id: "date-range",
        title: "Date Range Payments",
        description: "Export all payment transactions within a specific time period",
        icon: <CalendarDays className="h-6 w-6 text-blue-400" />,
        badge: "Essential",
        badgeColor: "bg-blue-600/20 text-blue-400 border-blue-500/30",
        useCase: "Monthly accounting, audit trails, financial reviews",
        exportFormats: ["PDF", "Excel"]
    },
    {
        id: "villa-wise",
        title: "Villa-wise Summary", 
        description: "Complete payment history and analysis for individual villas",
        icon: <Home className="h-6 w-6 text-green-400" />,
        badge: "Popular",
        badgeColor: "bg-green-600/20 text-green-400 border-green-500/30",
        useCase: "Resident inquiries, payment disputes, move-out settlements",
        exportFormats: ["PDF", "Excel"]
    },
    {
        id: "payment-heads",
        title: "Payment Head Reports",
        description: "Revenue analysis and breakdown by payment categories",
        icon: <DollarSign className="h-6 w-6 text-purple-400" />,
        badge: "Analytics",
        badgeColor: "bg-purple-600/20 text-purple-400 border-purple-500/30",
        useCase: "Budget planning, understanding revenue sources",
        exportFormats: ["PDF", "Excel", "Charts"]
    },
    {
        id: "outstanding",
        title: "Outstanding Payments",
        description: "Track unpaid and overdue amounts with aging analysis",
        icon: <AlertTriangle className="h-6 w-6 text-red-400" />,
        badge: "Critical",
        badgeColor: "bg-red-600/20 text-red-400 border-red-500/30",
        useCase: "Follow-up on dues, send payment reminders",
        exportFormats: ["PDF", "Excel"]
    }
];

export default function Reports() {
    const [currentView, setCurrentView] = useState<string>("main");

    const handleReportSelect = (reportId: string) => {
        setCurrentView(reportId);
    };

    const handleBackToMain = () => {
        setCurrentView("main");
    };

    // Render specific report component
    if (currentView === "date-range") {
        return <DateRangePayments onBack={handleBackToMain} />;
    }

    if (currentView === "villa-wise") {
        return <VillaWiseSummary onBack={handleBackToMain} />;
    }

    if (currentView === "payment-heads") {
        return <PaymentHeadReports onBack={handleBackToMain} />;
    }

    // Main reports dashboard

    return (
        <div className="min-h-screen bg-background p-6 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Reports & Analytics</h1>
                        <p className="text-lg text-gray-300">
                            Generate comprehensive reports for your society management needs
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-500/30 px-3 py-1">
                            <FileText className="h-4 w-4 mr-1" />
                            4 Report Types Available
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Main Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reportTypes.map((report) => (
                    <Card 
                        key={report.id} 
                        className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-opacity-60 bg-gray-900/50 border border-gray-700/50 backdrop-blur-sm group"
                        onClick={() => handleReportSelect(report.id)}
                    >
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                                        report.id === 'date-range' ? 'bg-blue-600/20 group-hover:bg-blue-600/30' :
                                        report.id === 'villa-wise' ? 'bg-green-600/20 group-hover:bg-green-600/30' :
                                        report.id === 'payment-heads' ? 'bg-purple-600/20 group-hover:bg-purple-600/30' :
                                        'bg-red-600/20 group-hover:bg-red-600/30'
                                    }`}>
                                        {report.icon}
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-semibold text-white group-hover:text-gray-100">
                                            {report.title}
                                        </CardTitle>
                                        <Badge className={`mt-2 border-0 ${report.badgeColor}`}>
                                            {report.badge}
                                        </Badge>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                            <CardDescription className="text-gray-300 text-base leading-relaxed">
                                {report.description}
                            </CardDescription>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-200 mb-1">Use Case:</p>
                                    <p className="text-sm text-gray-400">{report.useCase}</p>
                                </div>
                                
                                <div>
                                    <p className="text-sm font-medium text-gray-200 mb-2">Export Formats:</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {report.exportFormats.map((format, index) => (
                                            <Badge 
                                                key={index} 
                                                variant="outline" 
                                                className="text-xs border-gray-600 text-gray-300 bg-gray-800/50 hover:bg-gray-700/50"
                                            >
                                                <Download className="h-3 w-3 mr-1" />
                                                {format}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button 
                                className={`w-full mt-4 transition-all duration-300 ${
                                    report.id === 'date-range' ? 'bg-blue-600 hover:bg-blue-500 border-blue-500' :
                                    report.id === 'villa-wise' ? 'bg-green-600 hover:bg-green-500 border-green-500' :
                                    report.id === 'payment-heads' ? 'bg-purple-600 hover:bg-purple-500 border-purple-500' :
                                    'bg-red-600 hover:bg-red-500 border-red-500'
                                } text-white shadow-lg hover:shadow-xl group-hover:scale-105`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReportSelect(report.id);
                                }}
                            >
                                Generate {report.title}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions Section */}
            <Card className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-700/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-400" />
                        Quick Report Generation
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                        Need a report right now? Use these quick options to generate commonly requested reports.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button 
                            variant="outline" 
                            className="justify-start h-auto p-4 border-blue-600/50 bg-blue-900/20 hover:bg-blue-800/30 text-white hover:border-blue-500 transition-all duration-300"
                            onClick={() => handleReportSelect('date-range')}
                        >
                            <div className="text-left">
                                <div className="font-medium text-white">This Month's Payments</div>
                                <div className="text-sm text-gray-300">Current month transactions</div>
                            </div>
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            className="justify-start h-auto p-4 border-red-600/50 bg-red-900/20 hover:bg-red-800/30 text-white hover:border-red-500 transition-all duration-300"
                            onClick={() => handleReportSelect('outstanding')}
                        >
                            <div className="text-left">
                                <div className="font-medium text-white">Pending Payments</div>
                                <div className="text-sm text-gray-300">All outstanding amounts</div>
                            </div>
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            className="justify-start h-auto p-4 border-purple-600/50 bg-purple-900/20 hover:bg-purple-800/30 text-white hover:border-purple-500 transition-all duration-300"
                            onClick={() => handleReportSelect('payment-heads')}
                        >
                            <div className="text-left">
                                <div className="font-medium text-white">Revenue Summary</div>
                                <div className="text-sm text-gray-300">Payment category breakdown</div>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-xl bg-blue-600/20">
                            <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-2">Need Help with Reports?</h3>
                            <p className="text-gray-300 mb-3">
                                Each report can be customized with date ranges, specific villas, or payment types. 
                                All reports can be exported in multiple formats for your convenience.
                            </p>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500"
                            >
                                View Documentation
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
