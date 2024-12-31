import { ArrowUpRight, HomeIcon as House } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, type RootState } from "@/types";
import { useEffect, useMemo } from "react";
import { getPaymentHeads, getPayments } from "@/redux/user/userSlice";

export function Dashboard() {
    const { payments, villas, paymentHeads } = useSelector(
        (state: RootState) => state.user
    );
    const dispatch = useDispatch<AppDispatch>();
    const currentDate = new Date();
    const currentMonth = currentDate?.toLocaleString("default", {
        month: "long",
    });
    const currentYear = currentDate.getFullYear()?.toString();

    useEffect(() => {
        dispatch(getPayments());
        dispatch(getPaymentHeads());
    }, [dispatch]);

    const {
        monthlyReceived,
        monthlyPending,
        recentPayments,
        ownersPendingTotals,
    } = useMemo(() => {
        let monthlyReceived = 0;
        let monthlyPending = 0;
        const ownerTotals: Record<string, { name: string; amount: number }> =
            {};

        // First, initialize total pending for each payment head for each villa
        villas.forEach((villa) => {
            if (!villa.resident_name) return;

            ownerTotals[villa.resident_name] = {
                name: villa.resident_name,
                amount: 0,
            };

            const villaPayments = payments.find((p) => p.id === villa.id);
            if (!villaPayments) return;

            // Calculate totals for each payment head
            paymentHeads.forEach((head) => {
                const payment = villaPayments.Payments.find(
                    (p) =>
                        p.payment_head_id === head.id &&
                        p.latest_payment_month === currentMonth &&
                        p.payment_year?.toString() === currentYear
                );

                if (payment) {
                    monthlyReceived += payment.latest_payment;
                    monthlyPending += head.amount - payment.latest_payment;
                } else if (head.is_recurring) {
                    // If no payment found for recurring head, add full amount to pending
                    monthlyPending += head.amount;
                }

                // Calculate total pending for owner (across all months)
                const allPaymentsForHead = villaPayments.Payments.filter(
                    (p) => p.payment_head_id === head.id
                );

                if (head.is_recurring) {
                    // For recurring payments, calculate pending for all months in the year
                    const monthsInYear = 12;
                    const totalExpected = head.amount * monthsInYear;
                    const totalPaid = allPaymentsForHead.reduce(
                        (sum, p) =>
                            sum +
                            (p.payment_year?.toString() === currentYear
                                ? p.latest_payment
                                : 0),
                        0
                    );
                    ownerTotals[villa.resident_name!].amount +=
                        totalExpected - totalPaid;
                } else {
                    // For non-recurring payments, just take the difference
                    const paid = allPaymentsForHead.reduce(
                        (sum, p) => sum + p.latest_payment,
                        0
                    );
                    ownerTotals[villa.resident_name!].amount +=
                        head.amount - paid;
                }
            });
        });

        // Get recent payments
        const allPayments = payments
            .flatMap((payment) =>
                payment.Payments.map((p) => ({
                    ...p,
                    villa_number: payment.villa_number,
                    resident_name: payment.resident_name,
                    payment_date: new Date(p.latest_payment_date),
                }))
            )
            .filter((p) => p.resident_name) // Filter out payments without residents
            .sort((a, b) => b.payment_date.getTime() - a.payment_date.getTime())
            .slice(0, 5);

        // Sort owners by pending amount
        const sortedOwners = Object.values(ownerTotals)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return {
            monthlyReceived,
            monthlyPending,
            recentPayments: allPayments,
            ownersPendingTotals: sortedOwners,
        };
    }, [payments, paymentHeads, villas, currentMonth, currentYear]);

    return (
        <div className="flex min-h-screen w-full flex-col">
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid gap-4 md:grid-cols-2 md:gap-10 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Payment Received
                            </CardTitle>
                            <span className="h-4 w-4 text-muted-foreground">
                                PKR
                            </span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                PKR {monthlyReceived?.toLocaleString()} /-
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Amount paid this month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Payment Pending
                            </CardTitle>
                            <span className="h-4 w-4 text-muted-foreground">
                                PKR
                            </span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                PKR {monthlyPending?.toLocaleString()} /-
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Amount pending this month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Houses
                            </CardTitle>
                            <House className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {villas.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total houses
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-2">
                                <CardTitle>Payments</CardTitle>
                                <CardDescription>
                                    Recent Payments from villa owners
                                </CardDescription>
                            </div>
                            <Button asChild size="sm" className="ml-auto gap-1">
                                <Link to="/home/payments">
                                    View All
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Resident</TableHead>
                                        <TableHead>House No.</TableHead>
                                        <TableHead className="">
                                            Status
                                        </TableHead>
                                        <TableHead className="">Date</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentPayments.map(
                                        (payment, index) =>
                                            payment.latest_payment && (
                                                <TableRow key={index}>
                                                    <TableCell className="py-5">
                                                        <div className="font-medium">
                                                            {
                                                                payment.resident_name
                                                            }
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        <div className="font-medium">
                                                            {
                                                                payment.villa_number
                                                            }
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        <Badge
                                                            className="text-xs"
                                                            variant="outline"
                                                        >
                                                            Paid
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        {payment.payment_date.toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        PKR{" "}
                                                        {payment.latest_payment?.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Owners list</CardTitle>
                            <CardDescription>
                                Top 5 owners with most outstanding payments
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-8">
                            {ownersPendingTotals.map((owner) => (
                                <div
                                    className="flex items-center gap-4"
                                    key={owner.name}
                                >
                                    <Avatar className="hidden h-9 w-9 sm:flex">
                                        <AvatarImage
                                            src="/avatars/01.png"
                                            alt="Avatar"
                                        />
                                    </Avatar>
                                    <div className="grid gap-1">
                                        <p className="text-sm font-medium leading-none">
                                            {owner.name}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        +PKR {owner.amount?.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
