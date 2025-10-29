import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/types";
import { getPaymentById, getPendingMaintenancePayments } from "@/redux/user/userSlice";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Receipt } from "@/components/paymentReceipts";

interface DownloadPaymentReceiptDialogProps {
    paymentId: number;
}

export default function DownloadPaymentReceiptDialog({
    paymentId,
}: DownloadPaymentReceiptDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const { toast } = useToast();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            // Fetch payment details
            const paymentResult = await dispatch(getPaymentById(paymentId)).unwrap();
            const payment = paymentResult?.data || paymentResult;

            if (!payment) {
                throw new Error("Payment not found");
            }

            // Fetch pending maintenance payments for the villa
            let pendingPayments: any[] = [];
            try {
                const result = await dispatch(
                    getPendingMaintenancePayments(payment.villaId)
                ).unwrap();
                const dataArray = result?.data || result;
                pendingPayments = Array.isArray(dataArray) ? dataArray : [];
            } catch (error) {
                console.error("Failed to fetch pending payments:", error);
                pendingPayments = [];
            }

            // Prepare receipt data
            const receiptDataObj = {
                payment_id: payment.id,
                villa_number: payment.villa.villaNumber,
                villa_id: payment.villaId,
                resident_name: payment.villa.residentName || "N/A",
                receivable_amount: parseFloat(payment.receivableAmount),
                received_amount: parseFloat(payment.receivedAmount),
                pending_amount: parseFloat(payment.receivableAmount) - parseFloat(payment.receivedAmount),
                paymentMonth: monthNames[payment.paymentMonth - 1],
                paymentYear: payment.paymentYear.toString(),
                payment_category: payment.category.name,
                payment_method: payment.paymentMethod || "CASH",
                notes: payment.notes || "",
                payment_date: new Date(payment.paymentDate).toLocaleDateString(),
                pendingPayments: pendingPayments,
            };

            // Generate and download PDF
            const villaCode = payment.villa.villaNumber.replace(/[^a-zA-Z0-9]/g, '');
            const date = new Date().toISOString().split('T')[0];
            const fileName = `Receipt-${villaCode}-${payment.id}-${date}.pdf`;

            const blob = await pdf(<Receipt paymentData={receiptDataObj} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: "Success",
                description: "Receipt downloaded successfully",
            });
        } catch (error: any) {
            console.error("Download receipt error:", error);
            toast({
                title: "Error",
                description: error?.error || error?.message || "Failed to download receipt",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={isLoading}
            className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Download Receipt"
        >
            <Download className="h-4 w-4" />
        </Button>
    );
}
