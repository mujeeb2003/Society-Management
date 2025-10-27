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
    type Payment,
    type RootState,
    AppDispatch,
} from "@/types";
import { Card } from "@/components/ui/card";
import AddPaymentDialog from "./dialogs/AddPaymentDialog";
import DeletePaymentDialog from "./dialogs/DeletePaymentDialog";
import { getPayments, getPaymentCategories } from "@/redux/user/userSlice";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const formatCurrency = (amount: number | null) =>
    amount !== null ? `${amount.toLocaleString()}` : "-";

// ✅ Fixed months array to match your display needs
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
    const { payments, paymentCategories } = useSelector(
        (state: RootState) => state.user
    );
    const [filter, setFilter] = useState("");
    const [selectedYear, setSelectedYear] = useState(
        new Date().getFullYear().toString()
    );
    const [currentPage, setCurrentPage] = useState(0);
    const [currentTablePage, setCurrentTablePage] = useState(1);

    const fetchPaymentCategories = useCallback(() => {
        dispatch(getPaymentCategories(parseInt(selectedYear)));
    }, [dispatch, selectedYear]);

    const fetchPayments = useCallback(() => {
        dispatch(getPayments());
    }, [dispatch]);

    useEffect(() => {
        fetchPaymentCategories();
        fetchPayments();
    }, [fetchPaymentCategories, fetchPayments]);

    // ✅ Separate recurring and non-recurring categories
    const recurringCategories = paymentCategories.filter(
        (category) => category.isRecurring
    );
    const nonRecurringCategories = paymentCategories.filter(
        (category) => !category.isRecurring
    );

    // ✅ Determine which months to show and which are future
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11
    const isCurrentYear = parseInt(selectedYear) === currentDate.getFullYear();
    
    const getMonthStatus = (monthIndex: number) => {
        if (!isCurrentYear) return 'past'; // All months are available for past years
        if (monthIndex <= currentMonth) return 'current';
        return 'future';
    };

    // ✅ Helper function to find payment for specific month and category
    const getPaymentForMonthAndCategory = (
        payment: Payment,
        categoryId: number,
        monthShortName: string,
        year: string
    ) => {
        const categoryPayments = payment.Payments.find(
            (p) => p.payment_head_id === categoryId
        );

        if (!categoryPayments || !categoryPayments.all_payments) {
            return null;
        }

        // Convert month short name to number
        const monthNumber = months.indexOf(monthShortName) + 1;

        // Find the payment for this specific month and year
        const monthPayment = categoryPayments.all_payments.find(
            (p) =>
                p.paymentMonth === monthNumber &&
                p.paymentYear.toString() === year
        );

        return monthPayment || null;
    };

    // ✅ Helper function to get non-recurring payment (always show regardless of year)
    const getNonRecurringPayment = (
        payment: Payment,
        categoryId: number
    ) => {
        const categoryPayments = payment.Payments.find(
            (p) => p.payment_head_id === categoryId
        );
        return categoryPayments || null;
    };

    const { filteredData, totals } = useMemo(() => {
        // ✅ Filter and sort payments based on search criteria and villa ID
        const filtered = payments
            .filter(
                (payment) =>
                    payment.villa_number
                        .toLowerCase()
                        .includes(filter.toLowerCase()) ||
                    (payment.resident_name &&
                        payment.resident_name
                            .toLowerCase()
                            .includes(filter.toLowerCase()))
            )
            .sort((a, b) => a.id - b.id); // ✅ Sort by ID

        // Calculate totals for each month and payment category
        const totals = {
            received: {} as Record<string, number>,
            pending: {} as Record<string, number>,
            totalPending: 0,
        };

        // ✅ Initialize totals for recurring categories (monthly)
        recurringCategories.forEach((category) => {
            months.forEach((month) => {
                totals.received[`recurring-${category.id}-${month}`] = 0;
                totals.pending[`recurring-${category.id}-${month}`] = 0;
            });
        });

        // ✅ Initialize totals for non-recurring categories (one-time)
        nonRecurringCategories.forEach((category) => {
            totals.received[`nonrecurring-${category.id}`] = 0;
            totals.pending[`nonrecurring-${category.id}`] = 0;
        });

        // ✅ Calculate totals from filtered payments
        filtered.forEach((payment) => {
            // Process recurring categories
            recurringCategories.forEach((category) => {
                months.forEach((month) => {
                    const monthPayment = getPaymentForMonthAndCategory(
                        payment,
                        category.id,
                        month,
                        selectedYear
                    );

                    const key = `recurring-${category.id}-${month}`;

                    if (monthPayment) {
                        totals.received[key] += monthPayment.receivedAmount || 0;
                        totals.pending[key] += monthPayment.pendingAmount || 0;
                    } else {
                        // ✅ For months without payments, use standard amount as pending
                        const categoryData = payment.Payments.find(
                            (p) => p.payment_head_id === category.id
                        );
                        const standardAmount = categoryData?.payment_head_amount || 0;

                        // Only add to pending if villa has residents and not future month
                        if (payment.resident_name && getMonthStatus(months.indexOf(month)) !== 'future') {
                            totals.pending[key] += standardAmount;
                        }
                    }
                });
            });

            // Process non-recurring categories
            nonRecurringCategories.forEach((category) => {
                const categoryPayment = getNonRecurringPayment(payment, category.id);
                const key = `nonrecurring-${category.id}`;

                if (categoryPayment) {
                    totals.received[key] += categoryPayment.total_received || 0;
                    totals.pending[key] += categoryPayment.total_pending || 0;
                } else if (payment.resident_name) {
                    // If no payment record but villa has residents, assume full amount pending
                    // You might want to adjust this logic based on your business rules
                    totals.pending[key] += 0; // For now, don't add pending for missing non-recurring
                }
            });
        });

        // Calculate total pending
        totals.totalPending = Object.values(totals.pending).reduce(
            (sum, amount) => sum + amount,
            0
        );

        return { filteredData: filtered, totals };
    }, [payments, filter, selectedYear, recurringCategories, nonRecurringCategories]);

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

    const calculateTotalPending = (payment: Payment) => {
        if (!payment.resident_name) return 0; // No pending for vacant villas

        let total = 0;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const currentYear = currentDate.getFullYear();
        const isCurrentYear = parseInt(selectedYear) === currentYear;

        // Add pending from recurring categories
        recurringCategories.forEach((category) => {
            const categoryData = payment.Payments.find(
                (p) => p.payment_head_id === category.id
            );

            if (categoryData) {
                // Add existing pending from payment records
                total += categoryData.total_pending || 0;

                // For current year, check if we need to add pending for current month if no record exists
                if (isCurrentYear) {
                    const currentMonthPayment = categoryData.all_payments?.find(
                        (p) => p.paymentMonth === currentMonth && p.paymentYear === currentYear
                    );

                    if (!currentMonthPayment) {
                        // No payment record for current month, find the most recent month's receivable amount
                        const recentPayments = categoryData.all_payments
                            ?.filter((p) => p.paymentYear === currentYear && p.paymentMonth < currentMonth)
                            .sort((a, b) => b.paymentMonth - a.paymentMonth);

                        let standardAmount = categoryData.payment_head_amount || 0;

                        // If we have recent payments, use the most recent receivable amount
                        if (recentPayments && recentPayments.length > 0) {
                            standardAmount = recentPayments[0].receivableAmount || standardAmount;
                        }

                        // Add this amount to pending for current month
                        total += standardAmount;
                    }
                }
            } else if (isCurrentYear) {
                // No category data at all, but we're in current year - add standard amount for current month
                // This handles cases where villa has no payment history for this category
                // We'll use a default amount or skip this (you might want to define a fallback)
                // For now, we'll skip adding pending for categories with no data
            }
        });

        // Add pending from non-recurring categories
        nonRecurringCategories.forEach((category) => {
            const categoryData = payment.Payments.find(
                (p) => p.payment_head_id === category.id
            );

            if (categoryData) {
                total += categoryData.total_pending || 0;
            }
            // For non-recurring, we don't add monthly pending as they're one-time payments
        });

        return total;
    };

    // ✅ Helper function to determine if values should be displayed as "Waived"
    const getDisplayValue = (
        received: number, 
        receivable: number, 
        pending: number, 
        isVacant: boolean,
        paymentId?: number,
        villaNumber?: string,
        categoryName?: string,
        paymentMonth?: number,
        paymentYear?: number
    ) => {
        if (isVacant) return "-";
        if (receivable === 0 && received === 0 && pending === 0) return "Waived";
        
        if (received > 0 && paymentId && villaNumber && categoryName && paymentMonth && paymentYear) {
            return (
                <div className="flex items-center justify-center gap-1">
                    <span>{formatCurrency(received)}</span>
                    <DeletePaymentDialog
                        paymentId={paymentId}
                        villaNumber={villaNumber}
                        categoryName={categoryName}
                        amount={received}
                        paymentMonth={paymentMonth}
                        paymentYear={paymentYear}
                    />
                </div>
            );
        }
        
        return received > 0 ? formatCurrency(received) : "-";
    };

    const getPendingDisplayValue = (received: number, receivable: number, pending: number, isVacant: boolean, isFuture: boolean = false) => {
        if (isVacant) return "-";
        if (isFuture) return "-"; // Don't show pending for future months
        if (receivable === 0 && received === 0 && pending === 0) return "Waived";
        return formatCurrency(pending);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Payments Overview</h1>
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
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                    >
                        <SelectTrigger className="w-[180px] border-white">
                            <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                            {(() => {
                                const currentYear = new Date().getFullYear();
                                const years = [];
                                for (
                                    let year = currentYear;
                                    year >= currentYear - 2;
                                    year--
                                ) {
                                    years.push(
                                        <SelectItem
                                            key={year}
                                            value={year.toString()}
                                        >
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
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <AddPaymentDialog />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <Input
                    className="max-w-sm"
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
                                className="font-semibold text-center w-32"
                                rowSpan={3}
                            >
                                Villa Number
                            </TableHead>
                            <TableHead
                                className="font-semibold text-center w-48"
                                rowSpan={3}
                            >
                                Name of Residents
                            </TableHead>
                            <TableHead
                                className="font-semibold text-center w-32"
                                rowSpan={3}
                            >
                                Owner/Tenant
                            </TableHead>
                            {/* ✅ Non-recurring categories first */}
                            {nonRecurringCategories.map((category) => (
                                <TableHead
                                    key={`nonrecurring-${category.id}`}
                                    className="font-semibold text-center"
                                    colSpan={2}
                                >
                                    {category.name}
                                </TableHead>
                            ))}
                            {/* ✅ Then recurring categories */}
                            {recurringCategories.map((category) => (
                                <TableHead
                                    key={`recurring-${category.id}`}
                                    className="font-semibold text-center"
                                    colSpan={visibleMonths.length * 2}
                                >
                                    {category.name}
                                </TableHead>
                            ))}
                            <TableHead
                                className="font-semibold text-center w-40"
                                rowSpan={3}
                            >
                                Total Pending
                            </TableHead>
                        </TableRow>
                        <TableRow className="bg-secondary">
                            {/* ✅ Non-recurring categories - no month headers */}
                            {nonRecurringCategories.map((category) => (
                                <TableHead
                                    key={`nonrecurring-${category.id}-spacer`}
                                    className="font-semibold text-center"
                                    colSpan={2}
                                />
                            ))}
                            {/* ✅ Recurring categories - month headers */}
                            {recurringCategories.map((category) =>
                                visibleMonths.map((month) => {
                                    const monthStatus = getMonthStatus(months.indexOf(month));
                                    return (
                                        <TableHead
                                            key={`${category.id}-${month}`}
                                            className={`font-semibold text-center ${
                                                monthStatus === 'future' 
                                                    ? 'text-muted-foreground opacity-60' 
                                                    : ''
                                            }`}
                                            colSpan={2}
                                        >
                                            {month}
                                        </TableHead>
                                    );
                                })
                            )}
                        </TableRow>
                        <TableRow className="bg-secondary">
                            {/* ✅ Non-recurring categories - Received/Pending headers */}
                            {nonRecurringCategories.map((category) => (
                                <Fragment key={`nonrecurring-${category.id}-headers`}>
                                    <TableHead className="font-semibold text-center">
                                        Received
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                        Pending
                                    </TableHead>
                                </Fragment>
                            ))}
                            {/* ✅ Recurring categories - Received/Pending headers */}
                            {recurringCategories.map((category) =>
                                visibleMonths.map((month) => {
                                    const monthStatus = getMonthStatus(months.indexOf(month));
                                    return (
                                        <Fragment
                                            key={`${category.id}-${month}-headers`}
                                        >
                                            <TableHead 
                                                className={`font-semibold text-center ${
                                                    monthStatus === 'future' 
                                                        ? 'text-muted-foreground opacity-60' 
                                                        : ''
                                                }`}
                                            >
                                                Received
                                            </TableHead>
                                            <TableHead 
                                                className={`font-semibold text-center ${
                                                    monthStatus === 'future' 
                                                        ? 'text-muted-foreground opacity-60' 
                                                        : ''
                                                }`}
                                            >
                                                Pending
                                            </TableHead>
                                        </Fragment>
                                    );
                                })
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            <>
                                {paginatedData.map((payment) => (
                                    <TableRow
                                        key={payment.id}
                                        className="text-center"
                                    >
                                        <TableCell>
                                            {payment.villa_number}
                                        </TableCell>
                                        <TableCell>
                                            {payment.resident_name || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {payment.occupancy_type || "-"}
                                        </TableCell>
                                        
                                        {/* ✅ Non-recurring categories data */}
                                        {nonRecurringCategories.map((category) => {
                                            const categoryPayment = getNonRecurringPayment(payment, category.id);
                                            const received = categoryPayment?.total_received || 0;
                                            const pending = categoryPayment?.total_pending || 0;
                                            const receivable = categoryPayment?.total_receivable || 0;
                                            
                                            // Get the actual payment record for delete functionality
                                            const paymentRecord = categoryPayment?.all_payments?.[0];

                                            return (
                                                <Fragment key={`${payment.id}-nonrecurring-${category.id}`}>
                                                    <TableCell
                                                        className={`border-l border-gray-600 ${
                                                            payment.resident_name
                                                                ? ""
                                                                : "text-muted-foreground"
                                                        }`}
                                                    >
                                                        {getDisplayValue(
                                                            received, 
                                                            receivable, 
                                                            pending, 
                                                            !payment.resident_name,
                                                            paymentRecord?.id,
                                                            payment.villa_number,
                                                            category.name,
                                                            paymentRecord?.paymentMonth,
                                                            paymentRecord?.paymentYear
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        className={
                                                            payment.resident_name
                                                                ? ""
                                                                : "text-muted-foreground"
                                                        }
                                                    >
                                                        {getPendingDisplayValue(received, receivable, pending, !payment.resident_name)}
                                                    </TableCell>
                                                </Fragment>
                                            );
                                        })}

                                        {/* ✅ Recurring categories data */}
                                        {recurringCategories.map((category) =>
                                            visibleMonths.map((month) => {
                                                const monthStatus = getMonthStatus(months.indexOf(month));
                                                const monthPayment = getPaymentForMonthAndCategory(
                                                    payment,
                                                    category.id,
                                                    month,
                                                    selectedYear
                                                );

                                                // Get standard amount for this category
                                                const categoryData = payment.Payments.find(
                                                    (p) => p.payment_head_id === category.id
                                                );
                                                const standardAmount = categoryData?.payment_head_amount || 0;

                                                const receivedAmount = monthPayment?.receivedAmount || 0;
                                                const receivableAmount = monthPayment?.receivableAmount || 0;
                                                const pendingAmount = monthPayment
                                                    ? monthPayment.pendingAmount
                                                    : (payment.resident_name && monthStatus !== 'future')
                                                    ? standardAmount
                                                    : 0;

                                                return (
                                                    <Fragment
                                                        key={`${payment.id}-${category.id}-${month}`}
                                                    >
                                                        <TableCell
                                                            className={`border-l border-gray-600 ${
                                                                payment.resident_name
                                                                    ? monthStatus === 'future'
                                                                        ? "text-muted-foreground opacity-60"
                                                                        : ""
                                                                    : "text-muted-foreground"
                                                            }`}
                                                        >
                                                            {monthStatus === 'future' 
                                                                ? "-"
                                                                : getDisplayValue(
                                                                    receivedAmount, 
                                                                    receivableAmount, 
                                                                    pendingAmount, 
                                                                    !payment.resident_name,
                                                                    monthPayment?.id,
                                                                    payment.villa_number,
                                                                    category.name,
                                                                    monthPayment?.paymentMonth,
                                                                    monthPayment?.paymentYear
                                                                )
                                                            }
                                                        </TableCell>
                                                        <TableCell
                                                            className={
                                                                payment.resident_name
                                                                    ? monthStatus === 'future'
                                                                        ? "text-muted-foreground opacity-60"
                                                                        : ""
                                                                    : "text-muted-foreground"
                                                            }
                                                        >
                                                            {getPendingDisplayValue(
                                                                receivedAmount, 
                                                                receivableAmount, 
                                                                pendingAmount, 
                                                                !payment.resident_name,
                                                                monthStatus === 'future'
                                                            )}
                                                        </TableCell>
                                                    </Fragment>
                                                );
                                            })
                                        )}
                                        <TableCell
                                            className={`font-semibold ${
                                                payment.resident_name
                                                    ? ""
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {payment.resident_name
                                                ? formatCurrency(
                                                      calculateTotalPending(payment)
                                                  )
                                                : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {/* ✅ Totals Row */}
                                <TableRow className="bg-secondary/50 font-semibold">
                                    <TableCell
                                        colSpan={3}
                                        className="text-center"
                                    >
                                        Totals
                                    </TableCell>
                                    
                                    {/* ✅ Non-recurring totals */}
                                    {nonRecurringCategories.map((category) => (
                                        <Fragment key={`total-nonrecurring-${category.id}`}>
                                            <TableCell className="border-l border-gray-600">
                                                {formatCurrency(
                                                    totals.received[`nonrecurring-${category.id}`] || 0
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(
                                                    totals.pending[`nonrecurring-${category.id}`] || 0
                                                )}
                                            </TableCell>
                                        </Fragment>
                                    ))}
                                    
                                    {/* ✅ Recurring totals */}
                                    {recurringCategories.map((category) =>
                                        visibleMonths.map((month) => {
                                            const monthStatus = getMonthStatus(months.indexOf(month));
                                            return (
                                                <Fragment
                                                    key={`total-recurring-${category.id}-${month}`}
                                                >
                                                    <TableCell 
                                                        className={`border-l border-gray-600 ${
                                                            monthStatus === 'future' 
                                                                ? 'text-muted-foreground opacity-60' 
                                                                : ''
                                                        }`}
                                                    >
                                                        {formatCurrency(
                                                            totals.received[
                                                                `recurring-${category.id}-${month}`
                                                            ] || 0
                                                        )}
                                                    </TableCell>
                                                    <TableCell 
                                                        className={
                                                            monthStatus === 'future' 
                                                                ? 'text-muted-foreground opacity-60' 
                                                                : ''
                                                        }
                                                    >
                                                        {formatCurrency(
                                                            totals.pending[
                                                                `recurring-${category.id}-${month}`
                                                            ] || 0
                                                        )}
                                                    </TableCell>
                                                </Fragment>
                                            );
                                        })
                                    )}
                                    <TableCell>
                                        {formatCurrency(totals.totalPending)}
                                    </TableCell>
                                </TableRow>
                            </>
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        3 + 
                                        nonRecurringCategories.length * 2 + 
                                        recurringCategories.length * visibleMonths.length * 2 + 
                                        1
                                    }
                                    className="text-center"
                                >
                                    No data available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Table Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        setCurrentTablePage((prev) =>
                                            Math.max(1, prev - 1)
                                        )
                                    }
                                    className={
                                        currentTablePage === 1
                                            ? "pointer-events-none opacity-50"
                                            : "cursor-pointer"
                                    }
                                />
                            </PaginationItem>
                            {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        onClick={() =>
                                            setCurrentTablePage(i + 1)
                                        }
                                        isActive={currentTablePage === i + 1}
                                        className="cursor-pointer"
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        setCurrentTablePage((prev) =>
                                            Math.min(totalPages, prev + 1)
                                        )
                                    }
                                    className={
                                        currentTablePage === totalPages
                                            ? "pointer-events-none opacity-50"
                                            : "cursor-pointer"
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}



// -------------------------------------------------------------------------------------------------------------
// import { useState, useMemo, useEffect, Fragment, useCallback } from "react";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { useSelector, useDispatch } from "react-redux";
// import {
//     type Payable,
//     type Payment,
//     type RootState,
//     AppDispatch,
// } from "@/types";
// import { Card } from "@/components/ui/card";
// import AddPaymentDialog from "./dialogs/AddPaymentDialog";
// import { , getPayments } from "@/redux/user/userSlice";
// import {
//     Pagination,
//     PaginationContent,
//     PaginationItem,
//     PaginationLink,
//     PaginationNext,
//     PaginationPrevious,
// } from "@/components/ui/pagination";

// const formatCurrency = (amount: number | null) =>
//     amount !== null ? `${amount.toLocaleString()}` : "-";

// const months = [
//     "Jan",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
// ];

// const COLUMNS_PER_PAGE = 6;
// const ROWS_PER_PAGE = 20;

// export default function Payments() {
//     const dispatch = useDispatch<AppDispatch>();
//     const { payments, } = useSelector(
//         (state: RootState) => state.user
//     );
//     const [filter, setFilter] = useState("");
//     const [selectedYear, setSelectedYear] = useState(
//         new Date().getFullYear().toString()
//     );
//     const [currentPage, setCurrentPage] = useState(0);
//     const [currentTablePage, setCurrentTablePage] = useState(1);

//     const fetchPaymentHeads = useCallback(() => {
//         dispatch(getPaymentHeads());
//     }, [dispatch]);

//     const fetchPayments = useCallback(() => {
//         dispatch(getPayments());
//     }, [dispatch]);

//     useEffect(() => {
//         fetchPaymentHeads();
//         fetchPayments();
//     }, [fetchPaymentHeads, fetchPayments]);

//     const { filteredData, totals } = useMemo(() => {
//         // Group payments by villa ID
//         const groupedPayments = payments.reduce((acc, payment) => {
//             if (!acc[payment.id]) {
//                 acc[payment.id] = { ...payment, AllPayments: [] };
//             }
//             acc[payment.id].AllPayments.push(...payment.Payments);
//             return acc;
//         }, {} as Record<number, Payment & { AllPayments: Payable[] }>);

//         // Convert grouped payments back to array and filter
//         const filtered = Object.values(groupedPayments).filter(
//             (payment) =>
//                 payment.villa_number
//                     .toLowerCase()
//                     .includes(filter.toLowerCase()) ||
//                 (payment.resident_name &&
//                     payment.resident_name
//                         .toLowerCase()
//                         .includes(filter.toLowerCase()))
//         );

//         // Calculate totals for each month and payment head
//         const totals = {
//             received: {} as Record<string, number>,
//             pending: {} as Record<string, number>,
//             totalPending: 0,
//         };

//         // Initialize totals for each month
//         paymentHeads.forEach((head) => {
//             head.is_recurring
//                 ? months.forEach((month) => {
//                       totals.received[month] = 0;
//                       totals.pending[month] = 0;
//                   })
//                 : (totals.received[head.name] = 0,totals.pending[head.name] = 0)

//         });

//         filtered.forEach((payment) => {
//             paymentHeads.forEach((head) => {
//                 if (head.is_recurring) {
//                     months.forEach((month) => {
//                         const monthPayment = payment.AllPayments.find(
//                             (p) =>
//                                 p.payment_head_id === head.id &&
//                                 p.latest_payment_month === month &&
//                                 String(p.payment_year) === selectedYear
//                         );

//                         if (monthPayment) {
//                             totals.received[month] +=
//                                 monthPayment.latest_payment;
//                             totals.pending[month] +=
//                                 head.amount - monthPayment.latest_payment;
//                         } else {
//                             totals.pending[month] += head.amount;
//                         }
//                     });
//                 } else {
//                     const payment_found = payment.AllPayments.find(
//                         (p) => p.payment_head_id === head.id
//                     );
//                     if (payment_found) {
//                         totals.received[head.name] +=
//                             payment_found.latest_payment;
//                         totals.pending[head.name] +=
//                             head.amount - payment_found.latest_payment;
//                     } else {
//                         totals.pending[head.name] += head.amount;
//                     }
//                 }
//             });
//         });

//         // Calculate total pending
//         totals.totalPending = Object.values(totals.pending).reduce(
//             (sum, amount) => sum + amount,
//             0
//         );

//         return { filteredData: filtered, totals };
//     }, [payments, filter, selectedYear, paymentHeads]);

//     const paginatedData = useMemo(() => {
//         const startIndex = (currentTablePage - 1) * ROWS_PER_PAGE;
//         return filteredData.slice(startIndex, startIndex + ROWS_PER_PAGE);
//     }, [filteredData, currentTablePage]);

//     const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
//     const maxPages = Math.ceil(months.length / COLUMNS_PER_PAGE);
//     const visibleMonths = months.slice(
//         currentPage * COLUMNS_PER_PAGE,
//         (currentPage + 1) * COLUMNS_PER_PAGE
//     );

//     const getPaymentForHead = (
//         payment: Payment & { AllPayments: Payable[] },
//         headId: number,
//         month?: string
//     ) => {
//         return payment.AllPayments.find((p: Payable) => {
//             if (month) {
//                 return (
//                     p.payment_head_id === headId &&
//                     p.latest_payment_month === month &&
//                     String(p.payment_year) === selectedYear
//                 );
//             }
//             return p.payment_head_id === headId;
//         });
//     };

//     const calculateTotalPending = (
//         payment: Payment & { AllPayments: Payable[] }
//     ) => {
//         return paymentHeads.reduce((total: number, head: PaymentHead) => {
//             if (head.is_recurring) {
//                 const yearPayments = payment.AllPayments.filter(
//                     (p: Payable) =>
//                         String(p.payment_year) === selectedYear &&
//                         p.payment_head_id === head.id
//                 );
//                 const totalPaid = yearPayments.reduce(
//                     (sum: number, p: Payable) => sum + (p.latest_payment || 0),
//                     0
//                 );
//                 return total + (head.amount * 12 - totalPaid);
//             } else {
//                 const headPayment = getPaymentForHead(payment, head.id);
//                 return (
//                     total + (head.amount - (headPayment?.latest_payment || 0))
//                 );
//             }
//         }, 0);
//     };

//     return (
//         <div className="p-6 space-y-6">
//             <div className="flex justify-between items-center">
//                 <h1 className="text-3xl font-bold ">
//                     Payments Overview
//                 </h1>
//                 <div className="flex items-center gap-4">
//                     <Button
//                         variant="outline"
//                         size="icon"
//                         onClick={() =>
//                             setCurrentPage((prev) => Math.max(0, prev - 1))
//                         }
//                         disabled={currentPage === 0}
//                         className="border-white"
//                     >
//                         <ChevronLeft className="h-4 w-4 " />
//                     </Button>
//                     <Select
//                         value={selectedYear}
//                         onValueChange={setSelectedYear}
//                     >
//                         <SelectTrigger className="w-[180px] border-white ">
//                             <SelectValue placeholder="Select year" className=" " />
//                         </SelectTrigger>
//                         <SelectContent className="bg-background">
//                             {(() => {
//                                 const currentYear = new Date().getFullYear();
//                                 const earliestYear = payments.reduce((minYear, payment) => {
//                                     const paymentYears = payment.Payments.map(p => p.payment_year || currentYear);
//                                     return Math.min(minYear, ...paymentYears);
//                                 }, currentYear);

//                                 const years = [];
//                                 for (let year = currentYear; year >= earliestYear; year--) {
//                                     years.push(
//                                         <SelectItem key={year} value={year.toString()}>
//                                             {year}
//                                         </SelectItem>
//                                     );
//                                 }
//                                 return years;
//                             })()}
//                         </SelectContent>
//                     </Select>
//                     <Button
//                         variant="outline"
//                         size="icon"
//                         onClick={() =>
//                             setCurrentPage((prev) =>
//                                 Math.min(maxPages - 1, prev + 1)
//                             )
//                         }
//                         disabled={currentPage === maxPages - 1}
//                         className="border-white"
//                     >
//                         <ChevronRight className="h-4 w-4 " />
//                     </Button>
//                     <AddPaymentDialog />
//                 </div>
//             </div>

//             <div className="flex items-center space-x-4">
//                 <Input
//                     className="max-w-sm "
//                     placeholder="Filter by Villa Number or Resident Name"
//                     value={filter}
//                     onChange={(e) => setFilter(e.target.value)}
//                 />
//             </div>

//             <Card className="h-full min-h-screen bg-background">
//                 <Table>
//                     <TableHeader>
//                         <TableRow className="bg-secondary">
//                             <TableHead
//                                 className="font-semibold text-center w-32 "
//                                 rowSpan={3}
//                             >
//                                 Villa Number
//                             </TableHead>
//                             <TableHead
//                                 className="font-semibold text-center w-48 "
//                                 rowSpan={3}
//                             >
//                                 Name of Residents
//                             </TableHead>
//                             <TableHead
//                                 className="font-semibold text-center w-32 "
//                                 rowSpan={3}
//                             >
//                                 Owner/Tenant
//                             </TableHead>
//                             {paymentHeads.map((head) => (
//                                 <TableHead
//                                     key={head.id}
//                                     className="font-semibold text-center "
//                                     colSpan={
//                                         head.is_recurring
//                                             ? visibleMonths.length * 2
//                                             : 2
//                                     }
//                                 >
//                                     {head.name}
//                                 </TableHead>
//                             ))}
//                             <TableHead
//                                 className="font-semibold text-center w-40 "
//                                 rowSpan={3}
//                             >
//                                 Total Pending
//                             </TableHead>
//                         </TableRow>
//                         <TableRow className="bg-secondary">
//                             {paymentHeads.map((head) =>
//                                 head.is_recurring ? (
//                                     visibleMonths.map((month) => (
//                                         <TableHead
//                                             key={`${head.id}-${month}`}
//                                             className="font-semibold text-center "
//                                             colSpan={2}
//                                         >
//                                             {month}
//                                         </TableHead>
//                                     ))
//                                 ) : (
//                                     <TableHead
//                                         key={`${head.id}-columns`}
//                                         colSpan={2}
//                                     />
//                                 )
//                             )}
//                         </TableRow>
//                         <TableRow className="bg-secondary">
//                             {paymentHeads.map((head) =>
//                                 head.is_recurring ? (
//                                     visibleMonths.map((month) => (
//                                         <Fragment
//                                             key={`${head.id}-${month}-columns`}
//                                         >
//                                             <TableHead className="font-semibold text-center ">
//                                                 Received
//                                             </TableHead>
//                                             <TableHead className="font-semibold text-center ">
//                                                 Pending
//                                             </TableHead>
//                                         </Fragment>
//                                     ))
//                                 ) : (
//                                     <Fragment key={`${head.id}-columns`}>
//                                         <TableHead className="font-semibold text-center ">
//                                             Received
//                                         </TableHead>
//                                         <TableHead className="font-semibold text-center ">
//                                             Pending
//                                         </TableHead>
//                                     </Fragment>
//                                 )
//                             )}
//                         </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                         {paginatedData.length > 0 ? (
//                             <>
//                                 {paginatedData.map((payment) => (
//                                     <TableRow
//                                         key={payment.id}
//                                         className={`text-center`}
//                                     >
//                                         <TableCell className="">
//                                             {payment.villa_number}
//                                         </TableCell>
//                                         <TableCell className="">
//                                             {payment.resident_name || "-"}
//                                         </TableCell>
//                                         <TableCell className="">
//                                             {payment.occupancy_type || "-"}
//                                         </TableCell>
//                                         {paymentHeads.map((head) =>
//                                             head.is_recurring ? (
//                                                 visibleMonths.map((month) => {
//                                                     const monthPayment =
//                                                         getPaymentForHead(
//                                                             payment,
//                                                             head.id,
//                                                             month
//                                                         );
//                                                     return (
//                                                         <Fragment
//                                                             key={`${payment.id}-${head.id}-${month}`}
//                                                         >
//                                                             <TableCell
//                                                                 className={` border-l border-gray-600 ${
//                                                                     payment.resident_name
//                                                                         ? ""
//                                                                         : "text-muted"
//                                                                 }`}
//                                                             >
//                                                                 {monthPayment
//                                                                     ? formatCurrency(
//                                                                           monthPayment.latest_payment
//                                                                       )
//                                                                     : "-"}
//                                                             </TableCell>
//                                                             <TableCell
//                                                                 className={` ${
//                                                                     payment.resident_name
//                                                                         ? ""
//                                                                         : "text-muted"
//                                                                 }`}
//                                                             >
//                                                                 {monthPayment
//                                                                     ? formatCurrency(
//                                                                           head.amount -
//                                                                               monthPayment.latest_payment
//                                                                       )
//                                                                     : formatCurrency(
//                                                                           head.amount
//                                                                       )}
//                                                             </TableCell>
//                                                         </Fragment>
//                                                     );
//                                                 })
//                                             ) : (
//                                                 <Fragment
//                                                     key={`${payment.id}-${head.id}`}
//                                                 >
//                                                     <TableCell
//                                                         className={` border-l border-gray-600 ${
//                                                             payment.resident_name
//                                                                 ? ""
//                                                                 : "text-muted"
//                                                         }`}
//                                                     >
//                                                         {formatCurrency(
//                                                             getPaymentForHead(
//                                                                 payment,
//                                                                 head.id
//                                                             )?.latest_payment ||
//                                                                 0
//                                                         )}
//                                                     </TableCell>
//                                                     <TableCell
//                                                         className={` ${
//                                                             payment.resident_name
//                                                                 ? ""
//                                                                 : "text-muted"
//                                                         }`}
//                                                     >
//                                                         {formatCurrency(
//                                                             head.amount -
//                                                                 (getPaymentForHead(
//                                                                     payment,
//                                                                     head.id
//                                                                 )
//                                                                     ?.latest_payment ||
//                                                                     0)
//                                                         )}
//                                                     </TableCell>
//                                                 </Fragment>
//                                             )
//                                         )}
//                                         <TableCell
//                                             className={`font-semibold  ${
//                                                 payment.resident_name
//                                                     ? ""
//                                                     : "text-muted"
//                                             }`}
//                                         >
//                                             {payment.resident_name
//                                                 ? formatCurrency(
//                                                       calculateTotalPending(
//                                                           payment
//                                                       )
//                                                   )
//                                                 : "-"}
//                                         </TableCell>
//                                     </TableRow>
//                                 ))}
//                                 {/* Totals Row */}
//                                 <TableRow className="bg-secondary/50 font-semibold">
//                                     <TableCell
//                                         colSpan={3}
//                                         className=" text-center"
//                                     >
//                                         Totals
//                                     </TableCell>
//                                     {paymentHeads.map((head) =>
//                                         head.is_recurring ? (
//                                             visibleMonths.map((month) => (
//                                                 <Fragment
//                                                     key={`total-${head.id}-${month}`}
//                                                 >
//                                                     <TableCell className=" border-l border-gray-600">
//                                                         {formatCurrency(
//                                                             totals.received[
//                                                                 month
//                                                             ]
//                                                         )}
//                                                     </TableCell>
//                                                     <TableCell className="">
//                                                         {formatCurrency(
//                                                             totals.pending[
//                                                                 month
//                                                             ]
//                                                         )}
//                                                     </TableCell>
//                                                 </Fragment>
//                                             ))
//                                         ) : (
//                                             <Fragment key={`total-${head.id}`}>
//                                                 <TableCell className=" border-l border-gray-600">
//                                                     {formatCurrency(
//                                                         totals.received[
//                                                             head.name
//                                                         ]
//                                                     )}
//                                                 </TableCell>
//                                                 <TableCell className="">
//                                                     {formatCurrency(
//                                                         totals.pending[
//                                                             head.name
//                                                         ]
//                                                     )}
//                                                 </TableCell>
//                                             </Fragment>
//                                         )
//                                     )}
//                                     <TableCell className="">
//                                         {formatCurrency(totals.totalPending)}
//                                     </TableCell>
//                                 </TableRow>
//                             </>
//                         ) : (
//                             <TableRow>
//                                 <TableCell
//                                     colSpan={paymentHeads.reduce(
//                                         (total, head) =>
//                                             total +
//                                             (head.is_recurring
//                                                 ? visibleMonths.length * 2
//                                                 : 2),
//                                         4
//                                     )}
//                                     className="text-center "
//                                 >
//                                     No data available
//                                 </TableCell>
//                             </TableRow>
//                         )}
//                     </TableBody>
//                 </Table>
//             </Card>

//             {/* Table Pagination */}
//             <div className="flex justify-center mt-4 ">
//                 <Pagination>
//                     <PaginationContent>
//                         <PaginationItem className="border-white">
//                             <PaginationPrevious
//                                 onClick={() =>
//                                     setCurrentTablePage((prev) =>
//                                         Math.max(1, prev - 1)
//                                     )
//                                 }
//                                 // disabled={currentTablePage === 1}
//                             />
//                         </PaginationItem>
//                         {[...Array(totalPages)].map((_, i) => (
//                             <PaginationItem key={i}>
//                                 <PaginationLink
//                                     onClick={() => setCurrentTablePage(i + 1)}
//                                     isActive={currentTablePage === i + 1}
//                                     className="border-white"
//                                 >
//                                     {i + 1}
//                                 </PaginationLink>
//                             </PaginationItem>
//                         ))}
//                         <PaginationItem className="border-white">
//                             <PaginationNext
//                                 onClick={() =>
//                                     setCurrentTablePage((prev) =>
//                                         Math.min(totalPages, prev + 1)
//                                     )
//                                 }
//                                 // disabled={currentTablePage === totalPages}
//                             />
//                         </PaginationItem>
//                     </PaginationContent>
//                 </Pagination>
//             </div>
//         </div>
//     );
// }