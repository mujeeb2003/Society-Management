import { store } from "./redux/store";

export type userState = {
    user: User;
    villas: Villas[];
    payments: Payment[];
    paymentHeads: PaymentHead[];
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
    villa_number: string;
    resident_name: string | null;
    occupancy_type: string | null;
};

export type Payment = {
    id: number;
    villa_number: string;
    resident_name: string;
    occupancy_type: string;
    is_recurring:boolean;
    Payments: Payable[];
};

export type PaymentHead = {
    id: number;
    name: string;
    description: string;
    amount: number;
    is_recurring: boolean;
};

export type Payable = {
    latest_payment: number;
    latest_payment_date: string;
    latest_payment_month:string;
    payment_year: number;
    payment_id: number;
    payment_head_id: number;
    payment_head_name: string;
    payment_head_amount: string;
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
