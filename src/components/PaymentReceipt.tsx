import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFDownloadLink,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";

// Define the payment data interface
interface PaymentData {
    payment_id?: number;
    villa_number: string;
    resident_name: string;
    amount: number | string;
    paymentMonth: string;
    paymentYear: string;
    payment_head?: string;
    payment_head_amount?: number;
}

// Define styles for the PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        padding: 15,
        fontFamily: "Helvetica",
    },
    header: {
        backgroundColor: "#2563eb",
        padding: 12,
        marginBottom: 15,
        borderRadius: 6,
    },
    title: {
        fontSize: 20,
        color: "#FFFFFF",
        textAlign: "center",
        fontWeight: "bold",
        marginBottom: 3,
    },
    subtitle: {
        fontSize: 11,
        color: "#e2e8f0",
        textAlign: "center",
    },
    receiptNumber: {
        backgroundColor: "#f8fafc",
        padding: 10,
        marginBottom: 15,
        borderRadius: 4,
        border: "1px solid #e2e8f0",
    },
    receiptNumberText: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#1e293b",
        textAlign: "center",
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 8,
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: 3,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: "#f8fafc",
        borderRadius: 3,
    },
    alternateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: "#ffffff",
        borderRadius: 3,
    },
    label: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#374151",
        flex: 1,
    },
    value: {
        fontSize: 11,
        color: "#1f2937",
        flex: 1,
        textAlign: "right",
    },
    amountSection: {
        backgroundColor: "#dcfce7",
        padding: 12,
        marginTop: 10,
        marginBottom: 10,
        borderRadius: 6,
        border: "2px solid #22c55e",
    },
    amountLabel: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#15803d",
        textAlign: "center",
        marginBottom: 3,
    },
    amountValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#15803d",
        textAlign: "center",
    },
    pendingSection: {
        backgroundColor: "#fef3c7",
        padding: 12,
        marginBottom: 15,
        borderRadius: 6,
        border: "2px solid #f59e0b",
    },
    pendingLabel: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#92400e",
        textAlign: "center",
        marginBottom: 3,
    },
    pendingValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#92400e",
        textAlign: "center",
    },
    footer: {
        marginTop: 15,
        paddingTop: 12,
        borderTop: "1px solid #e2e8f0",
        textAlign: "center",
    },
    footerText: {
        fontSize: 10,
        color: "#64748b",
        marginBottom: 3,
    },
    timestamp: {
        fontSize: 9,
        color: "#94a3b8",
    },
});

// Define the receipt component with types
const Receipt: React.FC<{ paymentData: PaymentData }> = ({ paymentData }) => {
    // Generate 8-digit receipt number from payment ID
    const generateReceiptNumber = (paymentId?: number): string => {
        if (!paymentId) return "00000000";
        return paymentId.toString().padStart(8, "0");
    };

    const receiptNumber = generateReceiptNumber(paymentData.payment_id);
    const currentDate = new Date();

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>PAYMENT RECEIPT</Text>
                    <Text style={styles.subtitle}>Society Management System</Text>
                </View>

                {/* Receipt Number */}
                <View style={styles.receiptNumber}>
                    <Text style={styles.receiptNumberText}>
                        Receipt No: #{receiptNumber}
                    </Text>
                </View>

                {/* Payment Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Information</Text>
                    
                    <View style={styles.row}>
                        <Text style={styles.label}>Date Issued:</Text>
                        <Text style={styles.value}>
                            {currentDate.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </Text>
                    </View>

                    <View style={styles.alternateRow}>
                        <Text style={styles.label}>Payment Month:</Text>
                        <Text style={styles.value}>{paymentData.paymentMonth}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Payment Year:</Text>
                        <Text style={styles.value}>{paymentData.paymentYear}</Text>
                    </View>

                    {paymentData.payment_head && (
                        <View style={styles.alternateRow}>
                            <Text style={styles.label}>Payment Type:</Text>
                            <Text style={styles.value}>{paymentData.payment_head}</Text>
                        </View>
                    )}
                </View>

                {/* Villa Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Villa Information</Text>
                    
                    <View style={styles.row}>
                        <Text style={styles.label}>Villa Number:</Text>
                        <Text style={styles.value}>{paymentData.villa_number}</Text>
                    </View>

                    <View style={styles.alternateRow}>
                        <Text style={styles.label}>Resident Name:</Text>
                        <Text style={styles.value}>{paymentData.resident_name}</Text>
                    </View>
                </View>

                {/* Amount Section */}
                <View style={styles.amountSection}>
                    <Text style={styles.amountLabel}>Amount Paid</Text>
                    <Text style={styles.amountValue}>
                        PKR {Number(paymentData.amount).toLocaleString()}
                    </Text>
                </View>

                {/* Pending Amount Section */}
                {paymentData.payment_head_amount && (
                    <View style={styles.pendingSection}>
                        <Text style={styles.pendingLabel}>Amount Pending</Text>
                        <Text style={styles.pendingValue}>
                            PKR {Math.max(0, paymentData.payment_head_amount - Number(paymentData.amount)).toLocaleString()}
                        </Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Thank you for your payment!</Text>
                    <Text style={styles.footerText}>
                        This is a computer-generated receipt and does not require a signature.
                    </Text>
                    <Text style={styles.timestamp}>
                        Generated on: {currentDate.toLocaleString()}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

// Define the main component that includes the download button
const PaymentReceipt: React.FC<{ paymentData: PaymentData }> = ({
    paymentData,
}) => {
    const generateReceiptNumber = (paymentId?: number): string => {
        if (!paymentId) return "00000000";
        return paymentId.toString().padStart(8, "0");
    };

    const receiptNumber = generateReceiptNumber(paymentData.payment_id);
    const fileName = `receipt_${receiptNumber}_${paymentData.villa_number.replace(/\s+/g, '_')}.pdf`;

    return (
        <PDFDownloadLink
            document={<Receipt paymentData={paymentData} />}
            fileName={fileName}
        >
            <Button className="w-full">Download Receipt</Button>
        </PDFDownloadLink>
    );
};

export default PaymentReceipt;
