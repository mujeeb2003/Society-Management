import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFDownloadLink,
    Image,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";

interface PendingPayment {
    month: number;
    year: number;
    monthName: string;
    pendingAmount: number;
    status: string;
}

interface PaymentReceiptProps {
    paymentData: {
        payment_id: number;
        villa_number: string;
        resident_name: string;
        receivable_amount: number;
        received_amount: number;
        pending_amount: number;
        paymentMonth: string;
        paymentYear: string;
        payment_category: string;
        payment_method: string;
        notes?: string;
        payment_date: string;
        pendingPayments?: PendingPayment[];
    };
}

const styles = StyleSheet.create({
    page: {
        padding: 30,
        backgroundColor: "#FFFFFF",
        fontFamily: "Helvetica",
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 10,
    },
    logo: {
        width: 90,
        height: 45,
    },
    header: {
        marginBottom: 8,
        borderBottom: "2px solid #1e40af",
        paddingBottom: 5,
    },
    title: {
        fontSize: 18,
        color: "#1e40af",
        textAlign: "center",
        fontWeight: "bold",
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 8,
        color: "#64748b",
        textAlign: "center",
    },
    receiptNumber: {
        backgroundColor: "#f1f5f9",
        padding: 5,
        marginBottom: 8,
    },
    receiptNumberText: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#334155",
        textAlign: "center",
    },
    villaSection: {
        marginBottom: 8,
        padding: 6,
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
    },
    villaRow: {
        flexDirection: "row",
        marginBottom: 2,
    },
    villaLabel: {
        fontSize: 8,
        color: "#64748b",
        width: "35%",
    },
    villaValue: {
        fontSize: 8,
        color: "#1e293b",
        fontWeight: "bold",
        width: "65%",
    },
    section: {
        marginBottom: 6,
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#1e40af",
        marginBottom: 4,
        paddingBottom: 2,
        borderBottom: "1px solid #cbd5e1",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 2,
        paddingHorizontal: 4,
    },
    label: {
        fontSize: 7,
        color: "#475569",
    },
    value: {
        fontSize: 7,
        color: "#1e293b",
        fontWeight: "bold",
    },
    amountSection: {
        backgroundColor: "#dcfce7",
        padding: 6,
        marginVertical: 6,
        border: "1px solid #86efac",
    },
    amountRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    amountLabel: {
        fontSize: 8,
        color: "#166534",
    },
    amountValue: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#166534",
    },
    pendingSection: {
        marginVertical: 6,
        padding: 5,
        backgroundColor: "#fef2f2",
        border: "1px solid #fecaca",
    },
    pendingSectionTitle: {
        fontSize: 8,
        fontWeight: "bold",
        color: "#991b1b",
        marginBottom: 3,
        textAlign: "center",
    },
    pendingItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 1,
        paddingHorizontal: 2,
    },
    pendingMonth: {
        fontSize: 6,
        color: "#7f1d1d",
    },
    pendingAmount: {
        fontSize: 6,
        color: "#7f1d1d",
        fontWeight: "bold",
    },
    pendingTotal: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 2,
        paddingHorizontal: 2,
        marginTop: 2,
        borderTop: "1px solid #fca5a5",
    },
    pendingTotalLabel: {
        fontSize: 7,
        color: "#991b1b",
        fontWeight: "bold",
    },
    pendingTotalValue: {
        fontSize: 8,
        color: "#991b1b",
        fontWeight: "bold",
    },
    footer: {
        marginTop: 8,
        paddingTop: 5,
        borderTop: "1px solid #e2e8f0",
    },
    footerText: {
        fontSize: 6,
        color: "#94a3b8",
        textAlign: "center",
        marginBottom: 1,
    },
    timestamp: {
        fontSize: 5,
        color: "#cbd5e1",
        textAlign: "center",
    },
});

const Receipt: React.FC<PaymentReceiptProps> = ({ paymentData }) => {
    const generateReceiptNumber = (paymentId?: number): string => {
        if (!paymentId) return "00000000";
        return paymentId.toString().padStart(8, "0");
    };

    const receiptNumber = generateReceiptNumber(paymentData.payment_id);
    const currentDate = new Date();
    
    // Safely handle pendingPayments - ensure it's an array
    const pendingPaymentsArray = Array.isArray(paymentData.pendingPayments) 
        ? paymentData.pendingPayments 
        : [];
    
    const totalPending = pendingPaymentsArray.reduce(
        (sum, p) => sum + (p.pendingAmount || 0),
        0
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.logoContainer}>
                    <Image style={styles.logo} src="/falaknaz-GP_logo.png" />
                </View>

                <View style={styles.header}>
                    <Text style={styles.title}>PAYMENT RECEIPT</Text>
                    <Text style={styles.subtitle}>Society Management System</Text>
                </View>

                <View style={styles.receiptNumber}>
                    <Text style={styles.receiptNumberText}>
                        Receipt No: #{receiptNumber}
                    </Text>
                </View>

                <View style={styles.villaSection}>
                    <View style={styles.villaRow}>
                        <Text style={styles.villaLabel}>Villa Number:</Text>
                        <Text style={styles.villaValue}>{paymentData.villa_number}</Text>
                    </View>
                    <View style={styles.villaRow}>
                        <Text style={styles.villaLabel}>Resident Name:</Text>
                        <Text style={styles.villaValue}>
                            {paymentData.resident_name || "N/A"}
                        </Text>
                    </View>
                    <View style={styles.villaRow}>
                        <Text style={styles.villaLabel}>Payment Date:</Text>
                        <Text style={styles.villaValue}>
                            {currentDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Payment Month:</Text>
                        <Text style={styles.value}>
                            {paymentData.paymentMonth} {paymentData.paymentYear}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Category:</Text>
                        <Text style={styles.value}>{paymentData.payment_category}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Payment Method:</Text>
                        <Text style={styles.value}>{paymentData.payment_method}</Text>
                    </View>
                    {paymentData.notes && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Notes:</Text>
                            <Text style={styles.value}>{paymentData.notes}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.amountSection}>
                    <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Receivable Amount:</Text>
                        <Text style={styles.amountValue}>
                            PKR {paymentData.receivable_amount.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Amount Received:</Text>
                        <Text style={styles.amountValue}>
                            PKR {paymentData.received_amount.toLocaleString()}
                        </Text>
                    </View>
                    {paymentData.pending_amount > 0 && (
                        <View style={[styles.amountRow, { marginTop: 3, paddingTop: 3, borderTop: '1px solid #86efac' }]}>
                            <Text style={[styles.amountLabel, { color: '#dc2626' }]}>Current Pending:</Text>
                            <Text style={[styles.amountValue, { color: '#dc2626' }]}>
                                PKR {paymentData.pending_amount.toLocaleString()}
                            </Text>
                        </View>
                    )}
                </View>

                {pendingPaymentsArray.length > 0 && (
                    <View style={styles.pendingSection}>
                        <Text style={styles.pendingSectionTitle}>
                            Outstanding Maintenance Payments
                        </Text>
                        {pendingPaymentsArray.map((pending, index) => (
                            <View key={index} style={styles.pendingItem}>
                                <Text style={styles.pendingMonth}>
                                    {pending.monthName} {pending.year} ({pending.status})
                                </Text>
                                <Text style={styles.pendingAmount}>
                                    PKR {(pending.pendingAmount || 0).toLocaleString()}
                                </Text>
                            </View>
                        ))}
                        <View style={styles.pendingTotal}>
                            <Text style={styles.pendingTotalLabel}>Total Pending:</Text>
                            <Text style={styles.pendingTotalValue}>
                                PKR {totalPending.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Thank you for your payment</Text>
                    <Text style={styles.footerText}>
                        For any queries, please contact the management office
                    </Text>
                    <Text style={styles.timestamp}>
                        Generated on: {currentDate.toLocaleString()}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ paymentData }) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-center">
                <PDFDownloadLink
                    document={<Receipt paymentData={paymentData} />}
                    fileName={`receipt-${paymentData.villa_number}-${Date.now()}.pdf`}
                    className="w-full max-w-md"
                >
                    <Button className="w-full">
                        Download Receipt
                    </Button>
                </PDFDownloadLink>
            </div>
        </div>
    );
};

export default PaymentReceipt;