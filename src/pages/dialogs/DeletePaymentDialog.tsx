import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/types";
import { deletePayment, getPayments } from "@/redux/user/userSlice";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface DeletePaymentDialogProps {
    paymentId: number;
    villaNumber: string;
    categoryName: string;
    amount: number;
    paymentMonth: number;
    paymentYear: number;
}

export default function DeletePaymentDialog({
    paymentId,
    villaNumber,
    categoryName,
    amount,
    paymentMonth,
    paymentYear,
}: DeletePaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const { toast } = useToast();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await dispatch(deletePayment(paymentId)).unwrap();
            toast({
                title: "Success",
                description: "Payment deleted successfully",
            });
            setOpen(false);
            // Refresh payments list
            dispatch(getPayments());
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.error || "Failed to delete payment",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Payment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this payment? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-4">
                        <div className="flex justify-between">
                            <span className="font-semibold">Villa:</span>
                            <span>{villaNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Category:</span>
                            <span>{categoryName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Month:</span>
                            <span>{monthNames[paymentMonth - 1]} {paymentYear}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Amount:</span>
                            <span className="text-lg">{amount.toLocaleString()}</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
