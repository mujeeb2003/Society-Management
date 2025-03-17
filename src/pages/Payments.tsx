import { useState, useMemo, useEffect, Fragment, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
    type Payable,
    type Payment,
    type PaymentHead,
    type RootState,
    AppDispatch,
} from "@/types";
import { Card } from "@/components/ui/card";
import AddPaymentDialog from "./dialogs/AddPaymentDialog";
import { getPaymentHeads, getPayments } from "@/redux/user/userSlice";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const formatCurrency = (amount: number | null) =>
    amount !== null ? `PKR ${amount.toLocaleString()} /-` : "-";

const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

const COLUMNS_PER_PAGE = 6;
const ROWS_PER_PAGE = 20;

export default function Payments() {
    const dispatch = useDispatch<AppDispatch>();
    const { payments, paymentHeads } = useSelector(
        (state: RootState) => state.user
    );
    const [filter, setFilter] = useState("");
    const [selectedYear, setSelectedYear] = useState(
        new Date().getFullYear().toString()
    );
    const [currentPage, setCurrentPage] = useState(0);
    const [currentTablePage, setCurrentTablePage] = useState(1);

    const fetchPaymentHeads = useCallback(() => {
        dispatch(getPaymentHeads());
    }, [dispatch]);

    const fetchPayments = useCallback(() => {
        dispatch(getPayments());
    }, [dispatch]);

    useEffect(() => {
        fetchPaymentHeads();
        fetchPayments();
    }, [fetchPaymentHeads, fetchPayments]);

    const { filteredData, totals } = useMemo(() => {
        // Group payments by villa ID
        const groupedPayments = payments.reduce((acc, payment) => {
            if (!acc[payment.id]) {
                acc[payment.id] = { ...payment, AllPayments: [] };
            }
            acc[payment.id].AllPayments.push(...payment.Payments);
            return acc;
        }, {} as Record<number, Payment & { AllPayments: Payable[] }>);

        // Convert grouped payments back to array and filter
        const filtered = Object.values(groupedPayments).filter(
            (payment) =>
                payment.villa_number
                    .toLowerCase()
                    .includes(filter.toLowerCase()) ||
                (payment.resident_name &&
                    payment.resident_name
                        .toLowerCase()
                        .includes(filter.toLowerCase()))
        );

        // Calculate totals for each month and payment head
        const totals = {
            received: {} as Record<string, number>,
            pending: {} as Record<string, number>,
            totalPending: 0,
        };

        // Initialize totals for each month
        paymentHeads.forEach((head) => {
            head.is_recurring
                ? months.forEach((month) => {
                      totals.received[month] = 0;
                      totals.pending[month] = 0;
                  })
                : (totals.received[head.name] = 0,totals.pending[head.name] = 0)
                

        });

        filtered.forEach((payment) => {
            paymentHeads.forEach((head) => {
                if (head.is_recurring) {
                    months.forEach((month) => {
                        const monthPayment = payment.AllPayments.find(
                            (p) =>
                                p.payment_head_id === head.id &&
                                p.latest_payment_month === month &&
                                String(p.payment_year) === selectedYear
                        );

                        if (monthPayment) {
                            totals.received[month] +=
                                monthPayment.latest_payment;
                            totals.pending[month] +=
                                head.amount - monthPayment.latest_payment;
                        } else {
                            totals.pending[month] += head.amount;
                        }
                    });
                } else {
                    const payment_found = payment.AllPayments.find(
                        (p) => p.payment_head_id === head.id
                    );
                    if (payment_found) {
                        totals.received[head.name] +=
                            payment_found.latest_payment;
                        totals.pending[head.name] +=
                            head.amount - payment_found.latest_payment;
                    } else {
                        totals.pending[head.name] += head.amount;
                    }
                }
            });
        });

        // Calculate total pending
        totals.totalPending = Object.values(totals.pending).reduce(
            (sum, amount) => sum + amount,
            0
        );

        return { filteredData: filtered, totals };
    }, [payments, filter, selectedYear, paymentHeads]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentTablePage - 1) * ROWS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [filteredData, currentTablePage]);

    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
    const maxPages = Math.ceil(months.length / COLUMNS_PER_PAGE);
    const visibleMonths = months.slice(
        currentPage * COLUMNS_PER_PAGE,
        (currentPage + 1) * COLUMNS_PER_PAGE
    );

    const getPaymentForHead = (
        payment: Payment & { AllPayments: Payable[] },
        headId: number,
        month?: string
    ) => {
        return payment.AllPayments.find((p: Payable) => {
            if (month) {
                return (
                    p.payment_head_id === headId &&
                    p.latest_payment_month === month &&
                    String(p.payment_year) === selectedYear
                );
            }
            return p.payment_head_id === headId;
        });
    };

    const calculateTotalPending = (
        payment: Payment & { AllPayments: Payable[] }
    ) => {
        return paymentHeads.reduce((total: number, head: PaymentHead) => {
            if (head.is_recurring) {
                const yearPayments = payment.AllPayments.filter(
                    (p: Payable) =>
                        String(p.payment_year) === selectedYear &&
                        p.payment_head_id === head.id
                );
                const totalPaid = yearPayments.reduce(
                    (sum: number, p: Payable) => sum + (p.latest_payment || 0),
                    0
                );
                return total + (head.amount * 12 - totalPaid);
            } else {
                const headPayment = getPaymentForHead(payment, head.id);
                return (
                    total + (head.amount - (headPayment?.latest_payment || 0))
                );
            }
        }, 0);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">
                    Payments Overview
                </h1>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                            setCurrentPage((prev) => Math.max(0, prev - 1))
                        }
                        disabled={currentPage === 0}
                        className="border-white"
                    >
                        <ChevronLeft className="h-4 w-4 text-white" />
                    </Button>
                    <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                    >
                        <SelectTrigger className="w-[180px] border-white text-white">
                            <SelectValue placeholder="Select year" className="text-white" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                            {(() => {
                                const currentYear = new Date().getFullYear();
                                const earliestYear = payments.reduce((minYear, payment) => {
                                    const paymentYears = payment.Payments.map(p => p.payment_year || currentYear);
                                    return Math.min(minYear, ...paymentYears);
                                }, currentYear);
                                
                                const years = [];
                                for (let year = currentYear; year >= earliestYear; year--) {
                                    years.push(
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    );
                                }
                                return years;
                            })()}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                            setCurrentPage((prev) =>
                                Math.min(maxPages - 1, prev + 1)
                            )
                        }
                        disabled={currentPage === maxPages - 1}
                        className="border-white"
                    >
                        <ChevronRight className="h-4 w-4 text-white" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <Input
                    className="max-w-sm text-white"
                    placeholder="Filter by Villa Number or Resident Name"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <Card className="h-full min-h-screen bg-background">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-secondary">
                            <TableHead
                                className="font-semibold text-center w-32 text-white"
                                rowSpan={3}
                            >
                                Villa Number
                            </TableHead>
                            <TableHead
                                className="font-semibold text-center w-48 text-white"
                                rowSpan={3}
                            >
                                Name of Residents
                            </TableHead>
                            <TableHead
                                className="font-semibold text-center w-32 text-white"
                                rowSpan={3}
                            >
                                Owner/Tenant
                            </TableHead>
                            {paymentHeads.map((head) => (
                                <TableHead
                                    key={head.id}
                                    className="font-semibold text-center text-white"
                                    colSpan={
                                        head.is_recurring
                                            ? visibleMonths.length * 2
                                            : 2
                                    }
                                >
                                    {head.name}
                                </TableHead>
                            ))}
                            <TableHead
                                className="font-semibold text-center w-40 text-white"
                                rowSpan={3}
                            >
                                Total Pending
                            </TableHead>
                            <TableHead
                                className="font-semibold text-center w-32 text-white"
                                rowSpan={3}
                            >
                                Actions
                            </TableHead>
                        </TableRow>
                        <TableRow className="bg-secondary">
                            {paymentHeads.map((head) =>
                                head.is_recurring ? (
                                    visibleMonths.map((month) => (
                                        <TableHead
                                            key={`${head.id}-${month}`}
                                            className="font-semibold text-center text-white"
                                            colSpan={2}
                                        >
                                            {month}
                                        </TableHead>
                                    ))
                                ) : (
                                    <TableHead
                                        key={`${head.id}-columns`}
                                        colSpan={2}
                                    />
                                )
                            )}
                        </TableRow>
                        <TableRow className="bg-secondary">
                            {paymentHeads.map((head) =>
                                head.is_recurring ? (
                                    visibleMonths.map((month) => (
                                        <Fragment
                                            key={`${head.id}-${month}-columns`}
                                        >
                                            <TableHead className="font-semibold text-center text-white">
                                                Received
                                            </TableHead>
                                            <TableHead className="font-semibold text-center text-white">
                                                Pending
                                            </TableHead>
                                        </Fragment>
                                    ))
                                ) : (
                                    <Fragment key={`${head.id}-columns`}>
                                        <TableHead className="font-semibold text-center text-white">
                                            Received
                                        </TableHead>
                                        <TableHead className="font-semibold text-center text-white">
                                            Pending
                                        </TableHead>
                                    </Fragment>
                                )
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            <>
                                {paginatedData.map((payment) => (
                                    <TableRow
                                        key={payment.id}
                                        className={`text-center`}
                                    >
                                        <TableCell className="text-white">
                                            {payment.villa_number}
                                        </TableCell>
                                        <TableCell className="text-white">
                                            {payment.resident_name || "-"}
                                        </TableCell>
                                        <TableCell className="text-white">
                                            {payment.occupancy_type || "-"}
                                        </TableCell>
                                        {paymentHeads.map((head) =>
                                            head.is_recurring ? (
                                                visibleMonths.map((month) => {
                                                    const monthPayment =
                                                        getPaymentForHead(
                                                            payment,
                                                            head.id,
                                                            month
                                                        );
                                                    return (
                                                        <Fragment
                                                            key={`${payment.id}-${head.id}-${month}`}
                                                        >
                                                            <TableCell
                                                                className={`text-white border-l border-gray-600 ${
                                                                    payment.resident_name
                                                                        ? ""
                                                                        : "text-muted"
                                                                }`}
                                                            >
                                                                {monthPayment
                                                                    ? formatCurrency(
                                                                          monthPayment.latest_payment
                                                                      )
                                                                    : "-"}
                                                            </TableCell>
                                                            <TableCell
                                                                className={`text-white ${
                                                                    payment.resident_name
                                                                        ? ""
                                                                        : "text-muted"
                                                                }`}
                                                            >
                                                                {monthPayment
                                                                    ? formatCurrency(
                                                                          head.amount -
                                                                              monthPayment.latest_payment
                                                                      )
                                                                    : formatCurrency(
                                                                          head.amount
                                                                      )}
                                                            </TableCell>
                                                        </Fragment>
                                                    );
                                                })
                                            ) : (
                                                <Fragment
                                                    key={`${payment.id}-${head.id}`}
                                                >
                                                    <TableCell
                                                        className={`text-white border-l border-gray-600 ${
                                                            payment.resident_name
                                                                ? ""
                                                                : "text-muted"
                                                        }`}
                                                    >
                                                        {formatCurrency(
                                                            getPaymentForHead(
                                                                payment,
                                                                head.id
                                                            )?.latest_payment ||
                                                                0
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        className={`text-white ${
                                                            payment.resident_name
                                                                ? ""
                                                                : "text-muted"
                                                        }`}
                                                    >
                                                        {formatCurrency(
                                                            head.amount -
                                                                (getPaymentForHead(
                                                                    payment,
                                                                    head.id
                                                                )
                                                                    ?.latest_payment ||
                                                                    0)
                                                        )}
                                                    </TableCell>
                                                </Fragment>
                                            )
                                        )}
                                        <TableCell
                                            className={`font-semibold text-white ${
                                                payment.resident_name
                                                    ? ""
                                                    : "text-muted"
                                            }`}
                                        >
                                            {payment.resident_name
                                                ? formatCurrency(
                                                      calculateTotalPending(
                                                          payment
                                                      )
                                                  )
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {payment.resident_name && (
                                                <AddPaymentDialog
                                                    villaId={payment.id}
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Totals Row */}
                                <TableRow className="bg-secondary/50 font-semibold">
                                    <TableCell
                                        colSpan={3}
                                        className="text-white text-center"
                                    >
                                        Totals
                                    </TableCell>
                                    {paymentHeads.map((head) =>
                                        head.is_recurring ? (
                                            visibleMonths.map((month) => (
                                                <Fragment
                                                    key={`total-${head.id}-${month}`}
                                                >
                                                    <TableCell className="text-white border-l border-gray-600">
                                                        {formatCurrency(
                                                            totals.received[
                                                                month
                                                            ]
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-white">
                                                        {formatCurrency(
                                                            totals.pending[
                                                                month
                                                            ]
                                                        )}
                                                    </TableCell>
                                                </Fragment>
                                            ))
                                        ) : (
                                            <Fragment key={`total-${head.id}`}>
                                                <TableCell className="text-white border-l border-gray-600">
                                                    {formatCurrency(
                                                        totals.received[
                                                            head.name
                                                        ]
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-white">
                                                    {formatCurrency(
                                                        totals.pending[
                                                            head.name
                                                        ]
                                                    )}
                                                </TableCell>
                                            </Fragment>
                                        )
                                    )}
                                    <TableCell className="text-white">
                                        {formatCurrency(totals.totalPending)}
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </>
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={paymentHeads.reduce(
                                        (total, head) =>
                                            total +
                                            (head.is_recurring
                                                ? visibleMonths.length * 2
                                                : 2),
                                        5
                                    )}
                                    className="text-center text-white"
                                >
                                    No data available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Table Pagination */}
            <div className="flex justify-center mt-4 text-white">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem className="border-white">
                            <PaginationPrevious
                                onClick={() =>
                                    setCurrentTablePage((prev) =>
                                        Math.max(1, prev - 1)
                                    )
                                }
                                // disabled={currentTablePage === 1}
                            />
                        </PaginationItem>
                        {[...Array(totalPages)].map((_, i) => (
                            <PaginationItem key={i}>
                                <PaginationLink
                                    onClick={() => setCurrentTablePage(i + 1)}
                                    isActive={currentTablePage === i + 1}
                                    className="border-white"
                                >
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem className="border-white">
                            <PaginationNext
                                onClick={() =>
                                    setCurrentTablePage((prev) =>
                                        Math.min(totalPages, prev + 1)
                                    )
                                }
                                // disabled={currentTablePage === totalPages}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}
