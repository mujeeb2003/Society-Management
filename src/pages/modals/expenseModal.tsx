import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, Receipt } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types";

type ExpenseModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Expense) => void;
    expenseToEdit?: Expense | null;
    loading?: boolean;
    categories?: string[];
};

const PAYMENT_METHODS = [
    { value: "CASH", label: "Cash" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "ONLINE", label: "Online Payment" },
];

const COMMON_CATEGORIES = [
    "Maintenance",
    "Security",
    "Utilities",
    "Cleaning",
    "Repairs",
    "Landscaping",
    "Insurance",
    "Office Supplies",
    "Legal Fees",
    "Marketing",
    "Other",
];

export function ExpenseModal({
    isOpen,
    onClose,
    onSave,
    expenseToEdit,
    loading = false,
    categories = [],
}: ExpenseModalProps) {
    const [expense, setExpense] = useState<Partial<Expense>>({
        category: "",
        description: "",
        amount: 0,
        expenseDate: new Date().toISOString().split("T")[0],
        paymentMethod: "CASH",
    });

    const [date, setDate] = useState<Date>(new Date());
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Combine common categories with existing categories
    const allCategories = Array.from(
        new Set([...COMMON_CATEGORIES, ...categories])
    ).sort();

    useEffect(() => {
        if (expenseToEdit) {
            const expenseDate = new Date(expenseToEdit.expenseDate);
            setExpense({ ...expenseToEdit });
            setDate(expenseDate);
        } else {
            const today = new Date();
            setExpense({
                category: "",
                description: "",
                amount: 0,
                expenseDate: today.toISOString().split("T")[0],
                expenseMonth: today.getMonth() + 1,
                expenseYear: today.getFullYear(),
                paymentMethod: "CASH",
            });
            setDate(today);
        }
        setErrors({});
    }, [expenseToEdit, isOpen]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setExpense((prev) => ({
            ...prev,
            [name]: name === "amount" ? parseFloat(value) || 0 : value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setExpense((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleDateChange = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            setDate(selectedDate);
            setExpense((prev) => ({
                ...prev,
                expenseDate: selectedDate.toISOString().split("T")[0],
                expenseMonth: selectedDate.getMonth() + 1,
                expenseYear: selectedDate.getFullYear(),
            }));

            if (errors.expenseDate) {
                setErrors((prev) => ({ ...prev, expenseDate: "" }));
            }
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!expense.category?.trim()) {
            newErrors.category = "Category is required";
        }

        if (!expense.description?.trim()) {
            newErrors.description = "Description is required";
        }

        if (!expense.amount || expense.amount <= 0) {
            newErrors.amount = "Amount must be greater than 0";
        }

        if (!expense.expenseDate) {
            newErrors.expenseDate = "Expense date is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) return;

        onSave({
            ...expense,
            category: expense.category!.trim(),
            description: expense.description!.trim(),
        } as Expense);
    };

    const handleClose = () => {
        if (!loading) {
            setErrors({});
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[600px]"
                aria-describedby="expense-dialog-description"
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        {expenseToEdit ? "Edit Expense" : "Add New Expense"}
                    </DialogTitle>
                    <DialogDescription id="expense-dialog-description">
                        {expenseToEdit
                            ? "Update the expense information below."
                            : "Enter the details for the new expense."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={expense.category || ""}
                                onValueChange={(value) =>
                                    handleSelectChange("category", value)
                                }
                                disabled={loading}
                            >
                                <SelectTrigger
                                    className={
                                        errors.category ? "border-red-500" : ""
                                    }
                                >
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCategories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <span className="text-sm text-red-500">
                                    {errors.category}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">
                                Amount (PKR){" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={expense.amount || ""}
                                onChange={handleChange}
                                placeholder="0.00"
                                disabled={loading}
                                className={
                                    errors.amount ? "border-red-500" : ""
                                }
                            />
                            {errors.amount && (
                                <span className="text-sm text-red-500">
                                    {errors.amount}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={expense.description || ""}
                            onChange={handleChange}
                            placeholder="Enter expense description..."
                            disabled={loading}
                            className={
                                errors.description ? "border-red-500" : ""
                            }
                            rows={3}
                        />
                        {errors.description && (
                            <span className="text-sm text-red-500">
                                {errors.description}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>
                                Expense Date{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground",
                                            errors.expenseDate &&
                                                "border-red-500"
                                        )}
                                        disabled={loading}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? (
                                            format(date, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={handleDateChange}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.expenseDate && (
                                <span className="text-sm text-red-500">
                                    {errors.expenseDate}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod">
                                Payment Method
                            </Label>
                            <Select
                                value={expense.paymentMethod || "CASH"}
                                onValueChange={(value) =>
                                    handleSelectChange("paymentMethod", value)
                                }
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map((method) => (
                                        <SelectItem
                                            key={method.value}
                                            value={method.value}
                                        >
                                            {method.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Summary:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">
                                    Category:
                                </span>
                                <span className="ml-2">
                                    {expense.category || "Not selected"}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Amount:
                                </span>
                                <span className="ml-2 font-medium">
                                    PKR{" "}
                                    {expense.amount?.toLocaleString() || "0"}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Date:
                                </span>
                                <span className="ml-2">
                                    {date
                                        ? format(date, "PPP")
                                        : "Not selected"}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Method:
                                </span>
                                <span className="ml-2">
                                    {PAYMENT_METHODS.find(
                                        (m) => m.value === expense.paymentMethod
                                    )?.label || "Cash"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {expenseToEdit ? "Updating..." : "Creating..."}
                            </>
                        ) : expenseToEdit ? (
                            "Update Expense"
                        ) : (
                            "Create Expense"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
