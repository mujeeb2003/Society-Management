import { store } from "./redux/store";

export type userState = {
    user: User;
    villas: Villas[];
    payments: Payment[];
    paymentCategories: PaymentCategory[];
    expenses: Expense[];
    isLoggedIn: boolean;
    error: string;
    loading: boolean;
};

export type User = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
};

export type Villas = {
    id: number;
    villaNumber: string;
    residentName: string | null;
    occupancyType: string | null;
    createdAt?: string;
    updatedAt?: string;
    totalPending?: number; // Add this
    totalPaid?: number; // Add this
    lastPaymentDate?: string; // Add this
};

export type VillaWithPayments = Villas & {
    totalPending?: number;
    totalPaid?: number;
    lastPaymentDate?: string;
    payments?: Array<{
        id: number;
        receivedAmount: number;
        paymentDate: string;
        category: {
            name: string;
        };
    }>;
};

// Update the existing Payment type to match new backend structure
export type Payment = {
    id: number;
    villa_number: string;
    resident_name: string | null;
    occupancy_type: string | null;
    Payments: PaymentDetail[];
};

export type PaymentDetail = {
    latest_payment: number;
    latest_payment_date: string;
    latest_payment_month: string;
    payment_year: number;
    payment_id: number;
    payment_head_id: number;
    payment_head_name: string;
    payment_head_amount: number;
    total_receivable: number;
    total_received: number;
    total_pending: number;
    payment_status: 'paid' | 'partial' | 'unpaid';
    all_payments: PaymentTransaction[];
};

export type PaymentTransaction = {
    id: number;
    receivableAmount: number;
    receivedAmount: number;
    pendingAmount: number;
    paymentDate: string;
    paymentMonth: number;
    paymentYear: number;
    paymentMethod: string;
    notes?: string;
};

export type PaymentCategory = {
    id: number;
    name: string;
    description: string | null;
    isRecurring: boolean;
    createdAt: string;
    updatedAt: string;
    isActive?: boolean;
};

export type Expense = {
    id: number;
    category: string;
    description: string;
    amount: number;
    expenseDate: string;
    expenseMonth: number;
    expenseYear: number;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
};

export type ExpenseAnalytics = {
    year: number;
    summary: {
        totalAmount: number;
        totalCount: number;
        averagePerExpense: number;
        averagePerMonth: number;
    };
    monthlyBreakdown: Array<{
        month: number;
        monthName: string;
        amount: number;
    }>;
    categoryBreakdown: Array<{
        category: string;
        amount: number;
        count: number;
        percentage: string;
    }>;
    paymentMethodBreakdown: Array<{
        method: string;
        amount: number;
        count: number;
        percentage: string;
    }>;
    topCategories: Array<{
        category: string;
        amount: number;
        count: number;
        percentage: string;
    }>;
};

export type Payable = {
    latest_payment: number;
    latest_payment_date: string;
    latest_payment_month: string;
    payment_year: number;
    payment_id: number;
    payment_head_id: number;
    payment_head_name: string;
    payment_head_amount: string;
};

export interface DashboardStats {
    overview: {
        currentMonth: number;
        currentYear: number;
        monthName: string;
    };
    villaStats: {
        totalVillas: number;
        occupancyBreakdown: {
            occupied: number;
            vacant: number;
            [key: string]: number;
        };
        activeVillas: number;
    };
    monthlyFinancials: {
        totalReceived: number;
        totalReceivable: number;
        totalPending: number;
        collectionRate: string;
    };
    paymentStats: {
        villasFullyPaid: number;
        villasPartiallyPaid: number;
        villasUnpaid: number;
        totalPaymentTransactions: number;
    };
    expenseStats: {
        monthlyExpenses: number;
        expenseTransactions: number;
    };
    recentPayments: Array<{
        id: number;
        villaNumber: string;
        residentName: string;
        categoryName: string;
        receivedAmount: number;
        paymentDate: string;
        paymentMonth: number;
        paymentYear: number;
    }>;
    topPendingVillas: Array<{
        villaNumber: string;
        residentName: string;
        pendingAmount: number;
    }>;
    monthlyTrends: Array<{
        month: number;
        year: number;
        monthName: string;
        totalReceived: number;
        totalExpenses: number;
    }>;
    categoryBreakdown: Array<{
        categoryName: string;
        totalReceived: number;
        totalReceivable: number;
        transactionCount: number;
        collectionRate: number;
    }>;
    generatedAt: string;
}

export interface DashboardSummary {
    totalVillas: number;
    monthlyReceived: number;
    monthlyPending: number;
    monthlyExpenses: number;
    netBalance: number;
    month: number;
    year: number;
}

export interface MonthlyReport {
    month: number;
    year: number;
    monthName: string;
    summary: {
        previousBalance: number;
        totalReceipts: number;
        totalExpenses: number;
        currentBalance: number;
    };
    villaPayments: Array<{
        villaNumber: string;
        residentName: string | null;
        occupancyType: string;
        receivableAmount: number;
        receivedAmount: number;
        pendingAmount: number;
        paymentStatus: 'PAID' | 'PARTIAL' | 'NOT_PAID' | 'NOT_APPLICABLE';
    }>;
    expenses: Array<{
        category: string;
        total: number;
        count: number;
    }>;
    generatedAt: string;
}

export interface MonthlyBalance {
    id: number;
    month: number;
    year: number;
    monthName: string;
    previousBalance: number;
    totalReceipts: number;
    totalExpenses: number;
    currentBalance: number;
    createdAt: string;
    updatedAt: string;
}

export interface YearlySummary {
    year: number;
    totalReceipts: number;
    totalExpenses: number;
    startingBalance: number;
    endingBalance: number;
    monthlyData: Array<{
        month: number;
        monthName: string;
        receipts: number;
        expenses: number;
        balance: number;
    }>;
}

export interface VillaReport {
    villa: {
        id: number;
        villaNumber: string;
        residentName: string | null;
        occupancyType: string;
    };
    year: number;
    monthlyPayments: Array<{
        month: number;
        monthName: string;
        payments: Array<{
            id: number;
            categoryName: string;
            receivableAmount: number;
            receivedAmount: number;
            pendingAmount: number;
            paymentDate: string;
            paymentMethod: string;
            paymentStatus: string;
            notes?: string;
        }>;
        totalReceivable: number;
        totalReceived: number;
        totalPending: number;
    }>;
    yearlyTotals: {
        totalReceivable: number;
        totalReceived: number;
        totalPending: number;
        totalPayments: number;
    };
    paymentStats: {
        paidMonths: number;
        partialMonths: number;
        unpaidMonths: number;
    };
    generatedAt: string;
}

export interface PendingPaymentsReport {
    month: number;
    year: number;
    monthName: string;
    summary: {
        totalVillasWithPending: number;
        totalPendingAmount: number;
        totalReceivableAmount: number;
        totalReceivedAmount: number;
        unpaidVillas: number;
        partialPaidVillas: number;
    };
    pendingVillas: Array<{
        villaId: number;
        villaNumber: string;
        residentName: string;
        occupancyType: string;
        totalReceivable: number;
        totalReceived: number;
        totalPending: number;
        paymentStatus: 'unpaid' | 'partial';
        paymentDetails: Array<{
            categoryId: number | null;
            categoryName: string;
            receivableAmount: number;
            receivedAmount: number;
            pendingAmount: number;
        }>;
    }>;
    generatedAt: string;
}


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
