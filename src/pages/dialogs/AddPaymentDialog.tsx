import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/types";
import { postPayment, getPayments, getVillas, getPendingMaintenancePayments } from "@/redux/user/userSlice";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
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
import PaymentReceipt from "@/components/paymentReceipts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
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
    paymentMonths: string[]; // Changed from string to array
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
        paymentMonths: [], // Changed from empty string to empty array
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

        if (formData.paymentMonths.length === 0) {
            toast({
                title: "Validation Error",
                description: "Please select at least one month",
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
            let successCount = 0;
            let failedMonths: string[] = [];
            let createdPaymentIds: number[] = [];

            // Loop through all selected months and create payment for each
            for (const month of formData.paymentMonths) {
                try {
                    const paymentData = {
                        villaId: formData.villaId,
                        categoryId: formData.categoryId,
                        receivableAmount: parseFloat(
                            formData.receivableAmount.toString()
                        ),
                        receivedAmount: parseFloat(formData.receivedAmount.toString()),
                        paymentDate: new Date().toISOString(),
                        paymentMonth: monthNameToNumber[month],
                        paymentYear: parseInt(formData.paymentYear),
                        paymentMethod: formData.paymentMethod,
                        notes:
                            formData.notes ||
                            `${selectedCategory?.name} payment for ${month}-${formData.paymentYear}`,
                    };

                    const result = await dispatch(postPayment(paymentData)).unwrap();
                    // Store the payment ID from the response
                    console.log(result);
                    if (result?.data?.id) {
                        createdPaymentIds.push(result.data.id);
                    }
                    successCount++;
                } catch (error: any) {
                    console.error(`Failed to add payment for ${month}:`, error);
                    failedMonths.push(month);
                }
            }

            // ✅ Refresh payments data
            await dispatch(getPayments());

            // Show appropriate toast based on results
            if (successCount === formData.paymentMonths.length) {
                toast({
                    title: "Success",
                    description: `Payment${formData.paymentMonths.length > 1 ? 's' : ''} added successfully for ${formData.paymentMonths.length} month${formData.paymentMonths.length > 1 ? 's' : ''}`,
                    variant: "default",
                });
            } else if (successCount > 0) {
                toast({
                    title: "Partial Success",
                    description: `${successCount} payment(s) added. Failed for: ${failedMonths.join(", ")}`,
                    variant: "default",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to add payments for all selected months",
                    variant: "destructive",
                });
                return;
            }

            // ✅ Fetch pending maintenance payments for the villa
            let pendingPayments: any[] = [];
            try {
                const result = await dispatch(getPendingMaintenancePayments(formData.villaId)).unwrap();
                // Backend returns { message: "success", data: [...] }
                const dataArray = result?.data || result;
                pendingPayments = Array.isArray(dataArray) ? dataArray : [];
            } catch (error) {
                console.error("Failed to fetch pending payments:", error);
                // Continue anyway - receipt will show without pending payments
                pendingPayments = [];
            }

            // ✅ Prepare receipt data for the first month (for display)
            if (successCount > 0) {
                // Calculate total amounts for multiple months
                const totalReceivable = formData.receivableAmount * formData.paymentMonths.length;
                const totalReceived = formData.receivedAmount * formData.paymentMonths.length;
                const totalPending = totalReceivable - totalReceived;
                
                console.log("created payment ids:", JSON.stringify(createdPaymentIds));
                setReceiptData({
                    payment_id: createdPaymentIds[0] || Date.now(), // Use first payment ID
                    payment_ids: createdPaymentIds, // Store all payment IDs
                    villa_number: selectedVilla?.villaNumber,
                    villa_id: formData.villaId,
                    resident_name: selectedVilla?.residentName,
                    receivable_amount: totalReceivable, // Total for all months
                    received_amount: totalReceived, // Total for all months
                    pending_amount: totalPending, // Total pending
                    per_month_receivable: formData.receivableAmount, // Per month amount
                    per_month_received: formData.receivedAmount, // Per month amount
                    months_count: formData.paymentMonths.length,
                    paymentMonth: formData.paymentMonths.join(", "),
                    paymentYear: formData.paymentYear,
                    payment_category: selectedCategory?.name,
                    payment_method: formData.paymentMethod,
                    notes: formData.notes,
                    payment_date: new Date().toLocaleDateString(),
                    pendingPayments: pendingPayments, // Add pending payments to receipt data
                });
                setShowReceipt(true);
            }
        } catch (error: any) {
            console.error("Payment creation error:", error);
            toast({
                title: "Error",
                description: error?.message || "Failed to add payment",
                variant: "destructive",
            });
        }
    };

    const toggleMonth = (month: string) => {
        setFormData((prev) => ({
            ...prev,
            paymentMonths: prev.paymentMonths.includes(month)
                ? prev.paymentMonths.filter((m) => m !== month)
                : [...prev.paymentMonths, month],
        }));
    };

    const resetForm = () => {
        setFormData({
            villaId: 0,
            categoryId: 0,
            receivableAmount: 0,
            receivedAmount: 0,
            paymentMonths: [],
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
                    <DialogDescription>
                        Add a new payment record for a villa
                    </DialogDescription>
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

                        {/* ✅ Payment Months (Multi-select) */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="months" className="text-right">
                                Months
                            </Label>
                            <div className="col-span-3">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            {formData.paymentMonths.length === 0 ? (
                                                <span className="text-muted-foreground">
                                                    Select months
                                                </span>
                                            ) : (
                                                <span className="text-sm">
                                                    {formData.paymentMonths.join(", ")}
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="start">
                                        <div className="p-4 space-y-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="font-semibold">
                                                    Select Months
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            paymentMonths: [],
                                                        }))
                                                    }
                                                    className="h-8 px-2 text-xs"
                                                >
                                                    Clear all
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                                {months.map((month) => (
                                                    <div
                                                        key={month}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={month}
                                                            checked={formData.paymentMonths.includes(
                                                                month
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleMonth(month)
                                                            }
                                                        />
                                                        <label
                                                            htmlFor={month}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {month}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                {formData.paymentMonths.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {formData.paymentMonths.map((month) => (
                                            <Badge
                                                key={month}
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {month}
                                                <button
                                                    type="button"
                                                    className="ml-1 hover:text-destructive"
                                                    onClick={() => toggleMonth(month)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
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
                        {formData.receivableAmount > 0 && formData.paymentMonths.length > 0 && (
                            <div className="bg-secondary p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">
                                    Payment Summary
                                </h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Selected Months:</span>
                                        <span className="font-medium text-foreground">
                                            {formData.paymentMonths.length} month{formData.paymentMonths.length > 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Per Month Receivable:</span>
                                        <span>
                                            PKR{" "}
                                            {formData.receivableAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Per Month Received:</span>
                                        <span>
                                            PKR{" "}
                                            {formData.receivedAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1 font-semibold text-blue-600">
                                        <span>Total Receivable:</span>
                                        <span>
                                            PKR{" "}
                                            {(formData.receivableAmount * formData.paymentMonths.length).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-green-600">
                                        <span>Total Received:</span>
                                        <span>
                                            PKR{" "}
                                            {(formData.receivedAmount * formData.paymentMonths.length).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-semibold border-t pt-1">
                                        <span>Total Pending:</span>
                                        <span
                                            className={`${
                                                (formData.receivableAmount - formData.receivedAmount) * formData.paymentMonths.length > 0
                                                    ? "text-red-500"
                                                    : "text-green-500"
                                            }`}
                                        >
                                            PKR{" "}
                                            {(
                                                (formData.receivableAmount - formData.receivedAmount) * formData.paymentMonths.length
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
