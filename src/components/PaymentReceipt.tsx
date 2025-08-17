// import React from "react";
// import {
//     Document,
//     Page,
//     Text,
//     View,
//     StyleSheet,
//     PDFDownloadLink,
// } from "@react-pdf/renderer";
// import { Button } from "@/components/ui/button";

// // Define the payment data interface

// interface PaymentReceiptProps {
//     paymentData: {
//         payment_id: number;
//         villa_number: string;
//         resident_name: string;
//         receivable_amount: number;
//         received_amount: number;
//         pending_amount: number;
//         paymentMonth: string;
//         paymentYear: string;
//         payment_category: string;
//         payment_method: string;
//         notes?: string;
//         payment_date: string;
//     };
// }

// // Define styles for the PDF
// const styles = StyleSheet.create({
//     page: {
//         flexDirection: "column",
//         backgroundColor: "#FFFFFF",
//         padding: 15,
//         fontFamily: "Helvetica",
//     },
//     header: {
//         backgroundColor: "#2563eb",
//         padding: 12,
//         marginBottom: 15,
//         borderRadius: 6,
//     },
//     title: {
//         fontSize: 20,
//         color: "#FFFFFF",
//         textAlign: "center",
//         fontWeight: "bold",
//         marginBottom: 3,
//     },
//     subtitle: {
//         fontSize: 11,
//         color: "#e2e8f0",
//         textAlign: "center",
//     },
//     receiptNumber: {
//         backgroundColor: "#f8fafc",
//         padding: 10,
//         marginBottom: 15,
//         borderRadius: 4,
//         border: "1px solid #e2e8f0",
//     },
//     receiptNumberText: {
//         fontSize: 13,
//         fontWeight: "bold",
//         color: "#1e293b",
//         textAlign: "center",
//     },
//     section: {
//         marginBottom: 12,
//     },
//     sectionTitle: {
//         fontSize: 13,
//         fontWeight: "bold",
//         color: "#1e293b",
//         marginBottom: 8,
//         borderBottom: "1px solid #e2e8f0",
//         paddingBottom: 3,
//     },
//     row: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         marginBottom: 6,
//         paddingVertical: 4,
//         paddingHorizontal: 8,
//         backgroundColor: "#f8fafc",
//         borderRadius: 3,
//     },
//     alternateRow: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         marginBottom: 6,
//         paddingVertical: 4,
//         paddingHorizontal: 8,
//         backgroundColor: "#ffffff",
//         borderRadius: 3,
//     },
//     label: {
//         fontSize: 11,
//         fontWeight: "bold",
//         color: "#374151",
//         flex: 1,
//     },
//     value: {
//         fontSize: 11,
//         color: "#1f2937",
//         flex: 1,
//         textAlign: "right",
//     },
//     amountSection: {
//         backgroundColor: "#dcfce7",
//         padding: 12,
//         marginTop: 10,
//         marginBottom: 10,
//         borderRadius: 6,
//         border: "2px solid #22c55e",
//     },
//     amountLabel: {
//         fontSize: 13,
//         fontWeight: "bold",
//         color: "#15803d",
//         textAlign: "center",
//         marginBottom: 3,
//     },
//     amountValue: {
//         fontSize: 18,
//         fontWeight: "bold",
//         color: "#15803d",
//         textAlign: "center",
//     },
//     pendingSection: {
//         backgroundColor: "#fef3c7",
//         padding: 12,
//         marginBottom: 15,
//         borderRadius: 6,
//         border: "2px solid #f59e0b",
//     },
//     pendingLabel: {
//         fontSize: 13,
//         fontWeight: "bold",
//         color: "#92400e",
//         textAlign: "center",
//         marginBottom: 3,
//     },
//     pendingValue: {
//         fontSize: 16,
//         fontWeight: "bold",
//         color: "#92400e",
//         textAlign: "center",
//     },
//     footer: {
//         marginTop: 15,
//         paddingTop: 12,
//         borderTop: "1px solid #e2e8f0",
//         textAlign: "center",
//     },
//     footerText: {
//         fontSize: 10,
//         color: "#64748b",
//         marginBottom: 3,
//     },
//     timestamp: {
//         fontSize: 9,
//         color: "#94a3b8",
//     },
// });

// // Define the receipt component with types
// const Receipt: React.FC<{ paymentData: PaymentReceiptProps }> = ({ paymentData }) => {
//     // Generate 8-digit receipt number from payment ID
//     const generateReceiptNumber = (paymentId?: number): string => {
//         if (!paymentId) return "00000000";
//         return paymentId.toString().padStart(8, "0");
//     };

//     const receiptNumber = generateReceiptNumber(paymentData.payment_id);
//     const currentDate = new Date();

//     return (
//         <Document>
//             <Page size="A4" style={styles.page}>
//                 {/* Header */}
//                 <View style={styles.header}>
//                     <Text style={styles.title}>PAYMENT RECEIPT</Text>
//                     <Text style={styles.subtitle}>
//                         Society Management System
//                     </Text>
//                 </View>

//                 {/* Receipt Number */}
//                 <View style={styles.receiptNumber}>
//                     <Text style={styles.receiptNumberText}>
//                         Receipt No: #{receiptNumber}
//                     </Text>
//                 </View>

//                 {/* Payment Details Section */}
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>Payment Information</Text>

//                     <View style={styles.row}>
//                         <Text style={styles.label}>Date Issued:</Text>
//                         <Text style={styles.value}>
//                             {currentDate.toLocaleDateString("en-US", {
//                                 year: "numeric",
//                                 month: "long",
//                                 day: "numeric",
//                             })}
//                         </Text>
//                     </View>

//                     <View style={styles.alternateRow}>
//                         <Text style={styles.label}>Payment Month:</Text>
//                         <Text style={styles.value}>
//                             {paymentData.paymentMonth}
//                         </Text>
//                     </View>

//                     <View style={styles.row}>
//                         <Text style={styles.label}>Payment Year:</Text>
//                         <Text style={styles.value}>
//                             {paymentData.paymentYear}
//                         </Text>
//                     </View>

//                     {paymentData.payment_head && (
//                         <View style={styles.alternateRow}>
//                             <Text style={styles.label}>Payment Type:</Text>
//                             <Text style={styles.value}>
//                                 {paymentData.payment_head}
//                             </Text>
//                         </View>
//                     )}
//                 </View>

//                 {/* Villa Details Section */}
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>Villa Information</Text>

//                     <View style={styles.row}>
//                         <Text style={styles.label}>Villa Number:</Text>
//                         <Text style={styles.value}>
//                             {paymentData.villa_number}
//                         </Text>
//                     </View>

//                     <View style={styles.alternateRow}>
//                         <Text style={styles.label}>Resident Name:</Text>
//                         <Text style={styles.value}>
//                             {paymentData.resident_name}
//                         </Text>
//                     </View>
//                 </View>

//                 {/* Amount Section */}
//                 <View style={styles.amountSection}>
//                     <Text style={styles.amountLabel}>Amount Paid</Text>
//                     <Text style={styles.amountValue}>
//                         PKR {Number(paymentData.amount).toLocaleString()}
//                     </Text>
//                 </View>

//                 {/* Pending Amount Section */}
//                 {paymentData.payment_head_amount && (
//                     <View style={styles.pendingSection}>
//                         <Text style={styles.pendingLabel}>Amount Pending</Text>
//                         <Text style={styles.pendingValue}>
//                             PKR{" "}
//                             {Math.max(
//                                 0,
//                                 paymentData.payment_head_amount -
//                                     Number(paymentData.amount)
//                             ).toLocaleString()}
//                         </Text>
//                     </View>
//                 )}

//                 {/* Footer */}
//                 <View style={styles.footer}>
//                     <Text style={styles.footerText}>
//                         Thank you for your payment!
//                     </Text>
//                     <Text style={styles.footerText}>
//                         This is a computer-generated receipt and does not
//                         require a signature.
//                     </Text>
//                     <Text style={styles.timestamp}>
//                         Generated on: {currentDate.toLocaleString()}
//                     </Text>
//                 </View>
//             </Page>
//         </Document>
//     );
// };

// // Define the main component that includes the download button
// const PaymentReceipt: React.FC<{ paymentData: PaymentData }> = ({
//     paymentData,
// }) => {
//     const generateReceiptNumber = (paymentId?: number): string => {
//         if (!paymentId) return "00000000";
//         return paymentId.toString().padStart(8, "0");
//     };

//     const receiptNumber = generateReceiptNumber(paymentData.payment_id);
//     const fileName = `receipt_${receiptNumber}_${paymentData.villa_number.replace(
//         /\s+/g,
//         "_"
//     )}.pdf`;

//     return (
//         <PDFDownloadLink
//             document={<Receipt paymentData={paymentData} />}
//             fileName={fileName}
//         >
//             <Button className="w-full">Download Receipt</Button>
//         </PDFDownloadLink>
//     );
// };

// export default PaymentReceipt;

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
    };
}

// ✅ Updated PDF styles
const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        padding: 20,
        fontFamily: "Helvetica",
    },
    header: {
        backgroundColor: "#1e40af",
        padding: 15,
        marginBottom: 20,
        borderRadius: 8,
    },
    title: {
        fontSize: 24,
        color: "#FFFFFF",
        textAlign: "center",
        fontWeight: "bold",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: "#e2e8f0",
        textAlign: "center",
    },
    receiptNumber: {
        backgroundColor: "#f8fafc",
        padding: 12,
        marginBottom: 20,
        borderRadius: 6,
        border: "2px solid #e2e8f0",
    },
    receiptNumberText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e293b",
        textAlign: "center",
    },
    section: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: "#f9fafb",
        borderRadius: 6,
        border: "1px solid #e5e7eb",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 10,
        borderBottom: "1px solid #d1d5db",
        paddingBottom: 5,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: "#ffffff",
        borderRadius: 4,
    },
    alternateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: "#f3f4f6",
        borderRadius: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#374151",
        flex: 1,
    },
    value: {
        fontSize: 12,
        color: "#1f2937",
        flex: 1,
        textAlign: "right",
    },
    amountSection: {
        backgroundColor: "#dcfce7",
        padding: 15,
        marginTop: 15,
        marginBottom: 15,
        borderRadius: 8,
        border: "2px solid #22c55e",
    },
    amountLabel: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#15803d",
        textAlign: "center",
        marginBottom: 5,
    },
    amountValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#15803d",
        textAlign: "center",
    },
    pendingSection: {
        backgroundColor: "#fef3c7",
        padding: 15,
        marginBottom: 20,
        borderRadius: 8,
        border: "2px solid #f59e0b",
    },
    pendingLabel: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#92400e",
        textAlign: "center",
        marginBottom: 5,
    },
    pendingValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#92400e",
        textAlign: "center",
    },
    summarySection: {
        backgroundColor: "#e0f2fe",
        padding: 15,
        marginBottom: 20,
        borderRadius: 8,
        border: "2px solid #0284c7",
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#0c4a6e",
        textAlign: "center",
        marginBottom: 10,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#0c4a6e",
    },
    summaryValue: {
        fontSize: 12,
        color: "#0c4a6e",
        fontWeight: "bold",
    },
    footer: {
        marginTop: 20,
        paddingTop: 15,
        borderTop: "2px solid #e2e8f0",
        textAlign: "center",
    },
    footerText: {
        fontSize: 11,
        color: "#64748b",
        marginBottom: 4,
        textAlign: "center",
    },
    timestamp: {
        fontSize: 10,
        color: "#94a3b8",
        textAlign: "center",
        marginTop: 10,
    },
    notesSection: {
        backgroundColor: "#fef7ff",
        padding: 12,
        marginBottom: 15,
        borderRadius: 6,
        border: "1px solid #e9d5ff",
    },
    notesTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#7c3aed",
        marginBottom: 6,
    },
    notesText: {
        fontSize: 10,
        color: "#6b21a8",
        lineHeight: 1.4,
    },
});

// ✅ Updated Receipt PDF Document
const Receipt: React.FC<PaymentReceiptProps> = ({ paymentData }) => {
    // Generate 8-digit receipt number from payment ID
    const generateReceiptNumber = (paymentId: number): string => {
        return `RCP${paymentId.toString().padStart(6, "0")}`;
    };

    const receiptNumber = generateReceiptNumber(paymentData.payment_id);
    const currentDate = new Date();

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>PAYMENT RECEIPT</Text>
                    <Text style={styles.subtitle}>
                        Society Management System
                    </Text>
                </View>

                {/* Receipt Number */}
                <View style={styles.receiptNumber}>
                    <Text style={styles.receiptNumberText}>
                        Receipt No: {receiptNumber}
                    </Text>
                </View>

                {/* Payment Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Information</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Date Issued:</Text>
                        <Text style={styles.value}>
                            {currentDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </Text>
                    </View>

                    <View style={styles.alternateRow}>
                        <Text style={styles.label}>Payment Period:</Text>
                        <Text style={styles.value}>
                            {paymentData.paymentMonth} {paymentData.paymentYear}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Payment Category:</Text>
                        <Text style={styles.value}>
                            {paymentData.payment_category}
                        </Text>
                    </View>

                    <View style={styles.alternateRow}>
                        <Text style={styles.label}>Payment Method:</Text>
                        <Text style={styles.value}>
                            {paymentData.payment_method}
                        </Text>
                    </View>
                </View>

                {/* Villa Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Villa Information</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Villa Number:</Text>
                        <Text style={styles.value}>
                            {paymentData.villa_number}
                        </Text>
                    </View>

                    <View style={styles.alternateRow}>
                        <Text style={styles.label}>Resident Name:</Text>
                        <Text style={styles.value}>
                            {paymentData.resident_name}
                        </Text>
                    </View>
                </View>

                {/* Payment Summary Section */}
                <View style={styles.summarySection}>
                    <Text style={styles.summaryTitle}>Payment Summary</Text>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                            Receivable Amount:
                        </Text>
                        <Text style={styles.summaryValue}>
                            PKR {paymentData.receivable_amount.toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                            Received Amount:
                        </Text>
                        <Text style={styles.summaryValue}>
                            PKR {paymentData.received_amount.toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Pending Amount:</Text>
                        <Text style={styles.summaryValue}>
                            PKR {paymentData.pending_amount.toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Amount Paid Section */}
                <View style={styles.amountSection}>
                    <Text style={styles.amountLabel}>Amount Paid</Text>
                    <Text style={styles.amountValue}>
                        PKR {paymentData.received_amount.toLocaleString()}
                    </Text>
                </View>

                {/* Pending Amount Section */}
                {paymentData.pending_amount > 0 && (
                    <View style={styles.pendingSection}>
                        <Text style={styles.pendingLabel}>
                            Remaining Balance
                        </Text>
                        <Text style={styles.pendingValue}>
                            PKR {paymentData.pending_amount.toLocaleString()}
                        </Text>
                    </View>
                )}

                {/* Notes Section */}
                {paymentData.notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesTitle}>Notes:</Text>
                        <Text style={styles.notesText}>
                            {paymentData.notes}
                        </Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Thank you for your payment!
                    </Text>
                    <Text style={styles.footerText}>
                        This is a computer-generated receipt and does not
                        require a signature.
                    </Text>
                    {paymentData.pending_amount > 0 && (
                        <Text style={styles.footerText}>
                            Please settle the remaining balance at your earliest
                            convenience.
                        </Text>
                    )}
                    <Text style={styles.timestamp}>
                        Generated on: {currentDate.toLocaleString()}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

// ✅ Main PaymentReceipt Component with Download Button
const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ paymentData }) => {
    const generateReceiptNumber = (paymentId: number): string => {
        return `RCP${paymentId.toString().padStart(6, "0")}`;
    };

    const receiptNumber = generateReceiptNumber(paymentData.payment_id);
    const fileName = `${receiptNumber}_${paymentData.villa_number.replace(
        /[^a-zA-Z0-9]/g,
        "_"
    )}_${paymentData.paymentMonth}_${paymentData.paymentYear}.pdf`;

    return (
        <div className="space-y-4">
            {/* Receipt Preview */}
            <div className="bg-secondary p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 text-center">
                    Payment Receipt Preview
                </h3>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="font-medium">Receipt Number:</span>
                        <span>{receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Villa:</span>
                        <span>{paymentData.villa_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Resident:</span>
                        <span>{paymentData.resident_name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Category:</span>
                        <span>{paymentData.payment_category}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Period:</span>
                        <span>
                            {paymentData.paymentMonth} {paymentData.paymentYear}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Payment Method:</span>
                        <span>{paymentData.payment_method}</span>
                    </div>

                    <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between">
                            <span className="font-medium">
                                Receivable Amount:
                            </span>
                            <span>
                                PKR{" "}
                                {paymentData.receivable_amount.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">
                                Received Amount:
                            </span>
                            <span className="text-green-600 font-bold">
                                PKR{" "}
                                {paymentData.received_amount.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Pending Amount:</span>
                            <span
                                className={`font-bold ${
                                    paymentData.pending_amount > 0
                                        ? "text-red-500"
                                        : "text-green-600"
                                }`}
                            >
                                PKR{" "}
                                {paymentData.pending_amount.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {paymentData.notes && (
                        <div className="border-t pt-3 mt-3">
                            <span className="font-medium">Notes:</span>
                            <p className="text-muted-foreground mt-1">
                                {paymentData.notes}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Download Button */}
            <PDFDownloadLink
                document={<Receipt paymentData={paymentData} />}
                fileName={fileName}
            >
                <Button className="w-full">Download Receipt</Button>
            </PDFDownloadLink>
        </div>
    );
};

export default PaymentReceipt;
