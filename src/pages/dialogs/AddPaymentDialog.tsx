import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AppDispatch, type RootState } from "@/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import { getPayments, postPayment } from "@/redux/user/userSlice";
import { useToast } from "@/hooks/use-toast";
import PaymentReceipt from "../../components/PaymentReceipt";

interface AddPaymentDialogProps {
    villaId: number;
}

interface FormData {
    amount: number;
    paymentMonth: string;
    paymentYear: string;
}

const AddPaymentDialog: React.FC<AddPaymentDialogProps> = ({
    villaId,
}) => {
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
    const [formData, setFormData] = useState<FormData>({ amount: 0, paymentMonth: "", paymentYear: "" });
    const { payments } = useSelector((state:RootState) => state.user);
    const dispatch = useDispatch<AppDispatch>();

    const [open, setOpen] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await dispatch(
            postPayment({
                villa_id: villaId,
                amount: formData.amount,
                payment_date: new Date().toISOString().split("T")[0],
                payment_month: formData.paymentMonth,
                payment_year: formData.paymentYear,
            })
        ).unwrap();
        if (res.data.id) {
            dispatch(getPayments());
            console.log(payments.filter((payment)=>payment.id === villaId)[0]);
            toast({title:"Updated successfully",description:"Payment added successfully"});
            setShowReceipt(true);
        }
        else{
            toast({title:"Error",description:"Payment could not be added"});
            setShowReceipt(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" onClick={()=>setOpen(true)}>Add Payment</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-foreground" >
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold mb-4 text-background">
                        Add Payment
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="amount"
                                className="text-right text-background"
                            >
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                value={formData.amount || 0}
                                min={1000}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        amount: parseInt(e.target.value),
                                    });
                                }}
                                className="col-span-3 text-background"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4 text-background">
                            <Label htmlFor="month" className="text-right">
                                Month
                            </Label>
                            <Select
                                onValueChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        paymentMonth: e,
                                    })
                                }
                            >
                                <SelectTrigger className="w-[280px] ">
                                    <SelectValue
                                        placeholder="Select a Month"
                                        className="text-background"
                                    />
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
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                                htmlFor="year"
                                className="text-right text-background"
                            >
                                Year
                            </Label>
                            <Input
                                id="year"
                                type="number"
                                value={formData.paymentYear || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        paymentYear: e.target.value,
                                    })
                                }
                                className="col-span-3 text-background"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Add Payment</Button>
                    </DialogFooter>
                </form>
                {showReceipt && (
                    <div className="mt-4">
                        {payments.filter((payment)=>payment.id === villaId).map((payment)=>(
                            <PaymentReceipt paymentData={{amount:formData.amount,resident_name:payment.resident_name,paymentMonth:formData.paymentMonth,paymentYear:formData.paymentYear,villa_number:payment.villa_number}} />
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AddPaymentDialog;