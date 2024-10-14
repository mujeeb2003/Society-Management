import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import type { Payment } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import Payments from "../Payments";

const ViewHistoryDialog = ({ payments }: { payments: Payment }) => {

    const monthlyPendingTotals = payments.Payments.reduce((acc, payment) => {
    acc += payments.Payable - payment.latest_payment;
    return acc;
  },0);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">View History</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px] bg-foreground">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold mb-4 text-background">{payments.villa_number} - {payments.resident_name} Payment History</DialogTitle>
                </DialogHeader>

                <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-foreground text-background">
                                <TableHead className="font-semibold">
                                    Month
                                </TableHead>
                                <TableHead className="font-semibold">
                                    Year
                                </TableHead>
                                <TableHead className="font-semibold">
                                    Amount Reveived
                                </TableHead>
                                <TableHead className="font-semibold">
                                    Amount Pending
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.Payments.map((payment, index) => (
                                <TableRow
                                    key={index}
                                    className="text-background"
                                >
                                    <TableCell>
                                        {format(new Date(payment.latest_payment_date), 'do MMMM')}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(payment.latest_payment_date), 'yyyy')}
                                    </TableCell>
                                    <TableCell>PKR {payment.latest_payment} /-</TableCell>
                                    <TableCell>
                                        PKR {payments.Payable - payment.latest_payment} /-
                                    </TableCell>
                                </TableRow>
                                
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {/* Display Monthly Pending Totals */}
                <div className="mt-4 flex flex-row items-center justify-center gap-3 text-background">
                    <h3 className="text-lg font-medium ">Total Pending Amount:</h3>
                    <h3 className="text-red-500 font-bold">{monthlyPendingTotals} /-</h3>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewHistoryDialog;
