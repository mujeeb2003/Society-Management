import { store } from "./redux/store";

export type userState = {
    user: User;
    villas: Villas[];
    payments : Payment[];
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
    owner_name: string;
    resident_name: string;
    occupancy_type: string;
    Payable: number;
};

export type Payment = {
    id:number;
    villa_number: string;
    resident_name: string;
    occupancy_type: string;
    Payable: number;
    Payments: Payable[];
};

export type Payable = {
    latest_payment: number;
    latest_payment_date: string;
    payment_id: number;
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
