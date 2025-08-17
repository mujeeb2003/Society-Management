import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/types";
import { postPayment, getPayments, getVillas } from "@/redux/user/userSlice";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import PaymentReceipt from "@/components/PaymentReceipt";
// import PaymentReceipt from "@/components/PaymentReceipt";

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const monthNameToNumber: { [key: string]: number } = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
};

interface FormData {
    villaId: number;
    categoryId: number;
    receivableAmount: number;
    receivedAmount: number;
    paymentMonth: string;
    paymentYear: string;
    paymentMethod: string;
    notes: string;
}

export default function AddPaymentDialog() {
    const dispatch = useDispatch<AppDispatch>();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        villaId: 0,
        categoryId: 0,
        receivableAmount: 0,
        receivedAmount: 0,
        paymentMonth: "",
        paymentYear: new Date().getFullYear().toString(),
        paymentMethod: "CASH",
        notes: "",
    });
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);

    const { paymentCategories, villas } = useSelector(
        (state: RootState) => state.user
    );
    const selectedCategory = paymentCategories.find(
        (cat) => cat.id === formData.categoryId
    );
    const selectedVilla = villas.find((villa) => villa.id === formData.villaId);

    useEffect(() => {
        dispatch(getVillas());
    }, [dispatch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Basic validation
        if (formData.villaId === 0) {
            toast({
                title: "Validation Error",
                description: "Please select a villa",
                variant: "destructive",
            });
            return;
        }

        if (formData.categoryId === 0) {
            toast({
                title: "Validation Error",
                description: "Please select a payment category",
                variant: "destructive",
            });
            return;
        }

        if (formData.receivedAmount > formData.receivableAmount) {
            toast({
                title: "Invalid amount",
                description: `Received amount cannot exceed receivable amount`,
                variant: "destructive",
            });
            return;
        }

        try {
            // ✅ Prepare payment data for new backend structure
            const paymentData = {
                villaId: formData.villaId,
                categoryId: formData.categoryId,
                receivableAmount: parseFloat(
                    formData.receivableAmount.toString()
                ),
                receivedAmount: parseFloat(formData.receivedAmount.toString()),
                paymentDate: new Date().toISOString(),
                paymentMonth: monthNameToNumber[formData.paymentMonth],
                paymentYear: parseInt(formData.paymentYear),
                paymentMethod: formData.paymentMethod,
                notes:
                    formData.notes ||
                    `${selectedCategory?.name} payment for ${formData.paymentMonth}-${formData.paymentYear}`,
            };

            console.log("Sending payment data:", paymentData);

            const result = await dispatch(postPayment(paymentData)).unwrap();

            // ✅ Refresh payments data
            await dispatch(getPayments());

            toast({
                title: "Success",
                description: "Payment added successfully",
                variant: "default",
            });

            console.log("Payment added successfully:", result);

            // ✅ Prepare receipt data
            setReceiptData({
                payment_id: result.data?.id || Date.now(),
                villa_number: selectedVilla?.villaNumber,
                resident_name: selectedVilla?.residentName,
                receivable_amount: formData.receivableAmount,
                received_amount: formData.receivedAmount,
                pending_amount:
                    formData.receivableAmount - formData.receivedAmount,
                paymentMonth: formData.paymentMonth,
                paymentYear: formData.paymentYear,
                payment_category: selectedCategory?.name,
                payment_method: formData.paymentMethod,
                notes: formData.notes,
                payment_date: new Date().toLocaleDateString(),
            });
            setShowReceipt(true);
        } catch (error: any) {
            console.error("Payment creation error:", error);
            toast({
                title: "Error",
                description: error?.message || "Failed to add payment",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setFormData({
            villaId: 0,
            categoryId: 0,
            receivableAmount: 0,
            receivedAmount: 0,
            paymentMonth: "",
            paymentYear: new Date().getFullYear().toString(),
            paymentMethod: "CASH",
            notes: "",
        });
        setShowReceipt(false);
        setReceiptData(null);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                setOpen(newOpen);
                if (!newOpen) {
                    resetForm();
                }
            }}
            
        >
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white">
                    Add Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        Add Payment
                    </DialogTitle>
                </DialogHeader>

                {!showReceipt ? (
                    <form onSubmit={handleSubmit} className="space-y-4 ">
                        {/* ✅ Villa Selection */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="villa" className="text-right">
                                Villa
                            </Label>
                            <div className="col-span-3">
                                <Select
                                    value={formData.villaId.toString()}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            villaId: parseInt(value),
                                        }))
                                    }
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a Villa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>
                                                Occupied Villas
                                            </SelectLabel>
                                            {villas
                                                .filter(
                                                    (villa) =>
                                                        villa.residentName &&
                                                        villa.residentName.trim() !==
                                                            ""
                                                )
                                                .map((villa) => (
                                                    <SelectItem
                                                        value={villa.id.toString()}
                                                        key={villa.id}
                                                    >
                                                        {villa.villaNumber} -{" "}
                                                        {villa.residentName}
                                                    </SelectItem>
                                                ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ✅ Payment Category Selection */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Payment Category
                            </Label>
                            <div className="col-span-3">
                                <Select
                                    value={formData.categoryId.toString()}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            categoryId: parseInt(value),
                                        }))
                                    }
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a Payment Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>
                                                Recurring Categories
                                            </SelectLabel>
                                            {paymentCategories
                                                .filter(
                                                    (cat) => cat.isRecurring
                                                )
                                                .map((category) => (
                                                    <SelectItem
                                                        value={category.id.toString()}
                                                        key={category.id}
                                                    >
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectGroup>
                                        <SelectGroup>
                                            <SelectLabel>
                                                One-time Categories
                                            </SelectLabel>
                                            {paymentCategories
                                                .filter(
                                                    (cat) => !cat.isRecurring
                                                )
                                                .map((category) => (
                                                    <SelectItem
                                                        value={category.id.toString()}
                                                        key={category.id}
                                                    >
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ✅ Receivable Amount */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="receivableAmount"
                                className="text-right"
                            >
                                Receivable Amount
                            </Label>
                            <Input
                                id="receivableAmount"
                                name="receivableAmount"
                                type="number"
                                value={formData.receivableAmount}
                                onChange={handleInputChange}
                                className="col-span-3"
                                min="0"
                                step="0.01"
                                placeholder="Enter total receivable amount"
                                required
                            />
                        </div>

                        {/* ✅ Received Amount */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="receivedAmount"
                                className="text-right"
                            >
                                Received Amount
                            </Label>
                            <Input
                                id="receivedAmount"
                                name="receivedAmount"
                                type="number"
                                value={formData.receivedAmount}
                                onChange={handleInputChange}
                                className="col-span-3"
                                min="0"
                                max={formData.receivableAmount}
                                step="0.01"
                                placeholder="Enter amount received"
                                required
                            />
                        </div>

                        {/* ✅ Payment Month */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="month" className="text-right">
                                Month
                            </Label>
                            <div className="col-span-3">
                                <Select
                                    value={formData.paymentMonth}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            paymentMonth: value,
                                        }))
                                    }
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Month</SelectLabel>
                                            {months.map((month) => (
                                                <SelectItem
                                                    value={month}
                                                    key={month}
                                                >
                                                    {month}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ✅ Payment Year */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="paymentYear" className="text-right">
                                Year
                            </Label>
                            <Input
                                id="paymentYear"
                                name="paymentYear"
                                type="number"
                                value={formData.paymentYear}
                                onChange={handleInputChange}
                                className="col-span-3"
                                min={2023}
                                max={2030}
                                required
                            />
                        </div>

                        {/* ✅ Payment Method */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="paymentMethod"
                                className="text-right"
                            >
                                Payment Method
                            </Label>
                            <div className="col-span-3">
                                <Select
                                    value={formData.paymentMethod}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            paymentMethod: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Payment Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>
                                                Payment Method
                                            </SelectLabel>
                                            <SelectItem value="CASH">
                                                Cash
                                            </SelectItem>
                                            <SelectItem value="BANK_TRANSFER">
                                                Bank Transfer
                                            </SelectItem>
                                            <SelectItem value="CHEQUE">
                                                Cheque
                                            </SelectItem>
                                            <SelectItem value="ONLINE">
                                                Online Payment
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ✅ Notes (Optional) */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">
                                Notes
                            </Label>
                            <Input
                                id="notes"
                                name="notes"
                                type="text"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="col-span-3"
                                placeholder="Optional notes"
                            />
                        </div>

                        {/* ✅ Summary Display */}
                        {formData.receivableAmount > 0 && (
                            <div className="bg-secondary p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">
                                    Payment Summary
                                </h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Receivable Amount:</span>
                                        <span>
                                            PKR{" "}
                                            {formData.receivableAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Received Amount:</span>
                                        <span>
                                            PKR{" "}
                                            {formData.receivedAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-semibold border-t pt-1">
                                        <span>Pending Amount:</span>
                                        <span
                                            className={`${
                                                formData.receivableAmount -
                                                    formData.receivedAmount >
                                                0
                                                    ? "text-red-500"
                                                    : "text-green-500"
                                            }`}
                                        >
                                            PKR{" "}
                                            {(
                                                formData.receivableAmount -
                                                formData.receivedAmount
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full">
                            Add Payment
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <PaymentReceipt paymentData={receiptData} />
                        <Button
                            onClick={() => {
                                setOpen(false);
                                resetForm();
                            }}
                            className="w-full"
                        >
                            Close
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
