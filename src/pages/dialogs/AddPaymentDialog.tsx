import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AppDispatch } from "@/types";
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
import { useDispatch } from "react-redux";
import { getPayments, postPayment } from "@/redux/user/userSlice";
import { useToast } from "@/hooks/use-toast";

interface AddPaymentDialogProps {
    villaId: number;
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
    const [formData, setformData] = useState<{
        amount: number;
        paymentMonth: string;
        paymentYear: string;
    }>({ amount: 0, paymentMonth: "", paymentYear: "" });
    const dispatch = useDispatch<AppDispatch>();

    const [Open, setOpen] = useState(false);
    const {toast} = useToast();

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
            setformData({ amount: 0, paymentMonth: "", paymentYear: "" });
            toast({title:"Updated successfully",description:"Payment added successfully"});
        }
        else{
            toast({title:"Error",description:"Payment could not be added"});
        }
        setOpen(false);
    };

    return (
        <Dialog open={Open} onOpenChange={setOpen}>
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
                                onChange={(e) => {
                                    setformData({
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
                                    setformData({
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
                                value={formData.paymentYear || "0000"}
                                onChange={(e) =>
                                    setformData({
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
            </DialogContent>
        </Dialog>
    );
};

export default AddPaymentDialog;
