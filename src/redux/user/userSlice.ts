import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PaymentHead, userState, Villas } from "@/types";
import axios from "axios";

const initialState: userState = {
    user: {
        id: 0,
        email: "",
        firstName: "",
        lastName: "",
    },
    villas: [],
    payments: [],
    paymentHeads: [],
    isLoggedIn: false,
    loading: false,
    error: "",
};

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const userLogin = createAsyncThunk(
    "user/login",
    async (
        credentials: { email: string; password: string },
        { rejectWithValue }
    ) => {
        try {
            const res = await axios.post(`${API_URL}/login`, credentials);
            return res.data;
        } catch (err: any) {
            if (err.response && err.response.data) {
                return rejectWithValue(err.response.data);
            }
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
);

export const userSignup = createAsyncThunk(
    "user/userSignup",
    async (
        credentials: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const res = await axios.post(`${API_URL}/users`, credentials);
            return res.data;
        } catch (err: any) {
            if (err.response && err.response.data) {
                return rejectWithValue(err.response.data);
            }
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
);

export const userLogout = createAsyncThunk(
    "user/logout",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_URL}/logout`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
);

export const getVillas = createAsyncThunk(
    "user/getVillas",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_URL}/villas`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
);

export const getPayments = createAsyncThunk(
    "user/getPayments",
    async (_, { rejectWithValue }) => {
        try {
            const res = axios.get(`${API_URL}/payments`);
            return (await res).data;
        } catch (error) {
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
);

export const postPayment = createAsyncThunk(
    "user/postPayment",
    async (
        credentials: {
            villa_id: number;
            amount: number;
            payment_head_id: number;
            payment_date: string;
            payment_month: string;
            payment_year: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const res = await axios.post(`${API_URL}/payments`, credentials);
            return res.data;
        } catch (err: any) {
            if (err.response && err.response.data) {
                return rejectWithValue(err.response.data);
            }
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
);

export const postVilla = createAsyncThunk(
    "user/postVilla",
    async (
        credentials: Villas,
        { rejectWithValue }
    ) => {
        try {
            const res = await axios.post(`${API_URL}/villas`, credentials);
            return res.data;
        } catch (error) {
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
);

export const editVilla = createAsyncThunk(
    "user/editVilla",
    async (credentials: Villas, { rejectWithValue }) => {
        try {
            const res = await axios.patch(
                `${API_URL}/villas/${credentials.id}`,
                credentials
            );
            return res.data;
        } catch (error) {
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
);

export const backupDatabase = createAsyncThunk(
    "user/backupDatabase",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/backupData`, {
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "payments.pdf");
            document.body.appendChild(link);
            link.click();
            link.parentNode!.removeChild(link);
            window.URL.revokeObjectURL(url);

            return "PDF downloaded successfully";
        } catch (error) {
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
);

export const getPaymentHeads = createAsyncThunk(
    "user/getPaymentHeads",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/payment-heads`);
            return response.data;
        } catch (error) {
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
)

export const postPaymentHead = createAsyncThunk(
    "user/postPaymentHead",
    async (paymentHead: Partial<PaymentHead>, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/payment-heads`, paymentHead);
            return response.data;
        } catch (error) {
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
)

export const deletePaymentHead = createAsyncThunk(
    "user/deletePaymentHead",
    async (paymentHeadId: number, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_URL}/payment-heads/${paymentHeadId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
)

export const updatePaymentHead = createAsyncThunk(
    "user/updatePaymentHead",
    async (paymentHead: PaymentHead, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`${API_URL}/payment-heads/${paymentHead.id}`, paymentHead);
            return response.data;
        } catch (error) {
            return rejectWithValue({ error: "Something went wrong" });
        }
    }
)

export const updateUser = createAsyncThunk("/user/updateUser", async () => {
    const user = localStorage.getItem("user");
    if (user) {
        return JSON.parse(user);
    }
    return {};
});

export const updateUserInfo = createAsyncThunk(
    "user/updateInfo",
    async (
        userInfo: { firstName: string; lastName: string; email: string, id: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.put(`${API_URL}/users/${userInfo.id}`, userInfo);
            return response.data;
        } catch (error:any) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const changePassword = createAsyncThunk(
    "user/changePassword",
    async (
        passwordData: { id:number; currentPassword: string; newPassword: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.put(
                `${API_URL}/users/${passwordData.id}/password`,
                passwordData
            );
            return response.data;
        } catch (error:any) {
            return rejectWithValue(error.response.data);
        }
    }
);

const userSlice = createSlice({
    initialState,
    name: `user`,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(userLogin.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(userLogin.fulfilled, (state, { payload }) => {
            state.loading = false;
            state.user = payload.data;
            localStorage.setItem("user", JSON.stringify(payload.data));

            state.isLoggedIn = true;
        });
        builder.addCase(userLogin.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(userSignup.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(userSignup.fulfilled, (state, {}) => {
            state.loading = false;
        });
        builder.addCase(userSignup.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(userLogout.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(userLogout.fulfilled, (state, { }) => {
            state.loading = false;
            state.user = {
                id: 0,
                email: "",
                firstName: "",
                lastName: "",
            };
            localStorage.removeItem("user");
            state.isLoggedIn = false;
            window.location.href = "/";
        });
        builder.addCase(userLogout.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(getVillas.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getVillas.fulfilled, (state, { payload }) => {
            state.loading = false;
            state.villas = payload.data;
        });
        builder.addCase(getVillas.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(getPayments.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getPayments.fulfilled, (state, { payload }) => {
            state.loading = false;
            state.payments = payload.data;
        });
        builder.addCase(getPayments.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(postPayment.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(postPayment.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(postPayment.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(postVilla.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(postVilla.fulfilled, (state, { }) => {
            state.loading = false;
            // state.villas.push(payload.data);
        });
        builder.addCase(postVilla.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(editVilla.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(editVilla.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(editVilla.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(backupDatabase.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(backupDatabase.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(backupDatabase.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(updateUser.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(updateUser.fulfilled, (state, { payload }) => {
            state.loading = false;
            if (payload) {
                state.user = payload;
                state.isLoggedIn = true;
                return;
            }
            state.isLoggedIn = false;
        });
        builder.addCase(updateUser.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(getPaymentHeads.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getPaymentHeads.fulfilled, (state, { payload }) => {
            state.loading = false;
            state.paymentHeads = payload.data;
        });
        builder.addCase(getPaymentHeads.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(postPaymentHead.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(postPaymentHead.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(postPaymentHead.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(updatePaymentHead.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(updatePaymentHead.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(updatePaymentHead.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(deletePaymentHead.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(deletePaymentHead.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(deletePaymentHead.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
    },
});

export const userReducer = userSlice.reducer;
export const {} = userSlice.actions;
