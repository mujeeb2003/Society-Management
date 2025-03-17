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
    villa_number: string;
    resident_name: string;
    amount: number| string;
    paymentMonth: string;
    paymentYear: string;
}

// Define styles for the PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        padding: 30,
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    header: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: "center",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    label: {
        fontSize: 12,
        fontWeight: "bold",
    },
    value: {
        fontSize: 12,
    },
    footer: {
        marginTop: 30,
        fontSize: 10,
        textAlign: "center",
        color: "gray",
    },
});

// Define the receipt component with types
const Receipt: React.FC<{ paymentData: PaymentData }> = ({ paymentData }) => (
  
  <Document>
      {JSON.stringify(paymentData)}
        <Page size="A4" style={styles.page}>
            <View style={styles.section}>
                <Text style={styles.header}>Payment Receipt</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>
                        {new Date().toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Villa Number:</Text>
                    <Text style={styles.value}>{paymentData.villa_number}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Resident Name:</Text>
                    <Text style={styles.value}>
                        {paymentData.resident_name}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Amount Paid:</Text>
                    <Text style={styles.value}>PKR {Number(paymentData.amount).toFixed(2)}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Amount Pending:</Text>
                    <Text style={styles.value}>
                        PKR {Math.max(0, 5000 - Number(paymentData.amount)).toFixed(2)}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Payment Month:</Text>
                    <Text style={styles.value}>{paymentData.paymentMonth}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Payment Year:</Text>
                    <Text style={styles.value}>{paymentData.paymentYear}</Text>
                </View>
                <Text style={styles.footer}>Thank you for your payment.</Text>
            </View>
        </Page>
    </Document>
);

// Define the main component that includes the download button
const PaymentReceipt: React.FC<{ paymentData: PaymentData }> = ({
    paymentData,
}) => (
    <PDFDownloadLink
        document={<Receipt paymentData={paymentData} />}
        fileName="payment_receipt.pdf"
    >
        <Button>Download Receipt</Button>
    </PDFDownloadLink>
);

export default PaymentReceipt;
