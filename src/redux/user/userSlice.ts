import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { userState } from "@/types";
import axios from "axios";

const userData = JSON.parse(localStorage.getItem("user") || "{}");

const initialState: userState = {
    user: userData
        ? userData
        : {
              id: 0,
              email: "",
              firstName: "",
              lastName: "",
          },
    villas: [],
    payments: [],
    paymentCategories: [],
    expenses: [],
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
            console.log(API_URL);
            const res = await axios.post(`${API_URL}/users/login`, credentials);

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
            const res = await axios.post(
                `${API_URL}/users/register`,
                credentials
            );
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
            const res = await axios.get(`${API_URL}/users/logout`);
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
            villaId: number;
            categoryId: number;
            receivableAmount: number;
            receivedAmount: number;
            paymentDate: string;
            paymentMonth: number;
            paymentYear: number;
            paymentMethod?: string;
            notes?: string;
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

export const getVillas = createAsyncThunk(
    "user/getVillas",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_URL}/villas`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const postVilla = createAsyncThunk(
    "user/postVilla",
    async (
        villaData: {
            villaNumber: string;
            residentName?: string | null;
            occupancyType?: string | null;
        },
        { rejectWithValue }
    ) => {
        try {
            const res = await axios.post(`${API_URL}/villas`, villaData);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const editVilla = createAsyncThunk(
    "user/editVilla",
    async (
        villaData: {
            id: number;
            villaNumber: string;
            residentName?: string | null;
            occupancyType?: string | null;
        },
        { rejectWithValue }
    ) => {
        try {
            const res = await axios.patch(`${API_URL}/villas/${villaData.id}`, {
                villaNumber: villaData.villaNumber,
                residentName: villaData.residentName,
                occupancyType: villaData.occupancyType,
            });
            return res.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const deleteVilla = createAsyncThunk(
    "user/deleteVilla",
    async (villaId: number, { rejectWithValue }) => {
        try {
            const res = await axios.delete(`${API_URL}/villas/${villaId}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getVillaById = createAsyncThunk(
    "user/getVillaById",
    async (villaId: number, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_URL}/villas/${villaId}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getOccupiedVillas = createAsyncThunk(
    "user/getOccupiedVillas",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_URL}/villas/occupied`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getVillaSummaries = createAsyncThunk(
    "user/getVillaSummaries",
    async (_, { rejectWithValue }) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(`${API_URL}/villas/summaries`, {
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            const result = await response.json();

            if (result.error) {
                return rejectWithValue(result.error);
            }

            return result;
        } catch (error: any) {
            return rejectWithValue(
                error.message || "Failed to fetch villa summaries"
            );
        }
    }
);

export const getPaymentCategories = createAsyncThunk(
    "user/getPaymentCategories",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/payment-categories`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const createPaymentCategory = createAsyncThunk(
    "user/createPaymentCategory",
    async (
        categoryData: {
            name: string;
            description?: string;
            isRecurring: boolean;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.post(
                `${API_URL}/payment-categories`,
                categoryData
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const updatePaymentCategory = createAsyncThunk(
    "user/updatePaymentCategory",
    async (
        categoryData: {
            id: number;
            name: string;
            description?: string;
            isRecurring: boolean;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.patch(
                `${API_URL}/payment-categories/${categoryData.id}`,
                {
                    name: categoryData.name,
                    description: categoryData.description,
                    isRecurring: categoryData.isRecurring,
                }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const deletePaymentCategory = createAsyncThunk(
    "user/deletePaymentCategory",
    async (categoryId: number, { rejectWithValue }) => {
        try {
            const response = await axios.delete(
                `${API_URL}/payment-categories/${categoryId}`
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const updateUser = createAsyncThunk("/user/updateUser", async () => {
    const user = localStorage.getItem("user");
    if (user) {
        return JSON.parse(user);
    }
    return {};
});

export const updateUserInfo = createAsyncThunk(
    "user/updateUserInfo",
    async (
        userData: {
            id: number;
            firstName: string;
            lastName: string;
            email: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const res = await axios.put(`${API_URL}/users/${userData.id}`, {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
            });
            return res.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const changePassword = createAsyncThunk(
    "user/changePassword",
    async (
        passwordData: {
            id: number;
            currentPassword: string;
            newPassword: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const res = await axios.put(
                `${API_URL}/users/${passwordData.id}/password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }
            );
            return res.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getDashboardStats = createAsyncThunk(
    "user/getDashboardStats",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_URL}/dashboards/stats`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getDashboardSummary = createAsyncThunk(
    "user/getDashboardSummary",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${API_URL}/dashboards/summary`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const backupDatabase = createAsyncThunk(
    "user/backupDatabase",
    async (format: "excel" | "pdf" = "excel", { rejectWithValue }) => {
        try {
            const response = await axios.get(
                `${API_URL}/backups/generate?format=${format}`,
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], {
                type:
                    format === "excel"
                        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        : "application/pdf",
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const fileName = `society_backup_${
                new Date().toISOString().split("T")[0]
            }.${format === "excel" ? "xlsx" : "pdf"}`;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode!.removeChild(link);
            window.URL.revokeObjectURL(url);

            return `${format.toUpperCase()} backup downloaded successfully`;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getExpenses = createAsyncThunk(
    "user/getExpenses",
    async (
        filters: {
            startDate?: string;
            endDate?: string;
            category?: string;
            month?: number;
            year?: number;
        } = {},
        { rejectWithValue }
    ) => {
        try {
            const queryParams = new URLSearchParams();
            if (filters?.startDate)
                queryParams.append("startDate", filters.startDate);
            if (filters?.endDate)
                queryParams.append("endDate", filters.endDate);
            if (filters?.category)
                queryParams.append("category", filters.category);
            if (filters?.month)
                queryParams.append("month", filters.month.toString());
            if (filters?.year)
                queryParams.append("year", filters.year.toString());

            const response = await axios.get(
                `${API_URL}/expenses?${queryParams.toString()}`
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const createExpense = createAsyncThunk(
    "user/createExpense",
    async (
        expenseData: {
            category: string;
            description: string;
            amount: number;
            expenseDate: string;
            expenseMonth: number;
            expenseYear: number;
            paymentMethod: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.post(
                `${API_URL}/expenses`,
                expenseData
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const updateExpense = createAsyncThunk(
    "user/updateExpense",
    async (
        expenseData: {
            id: number;
            category: string;
            description: string;
            amount: number;
            expenseDate: string;
            expenseMonth: number;
            expenseYear: number;
            paymentMethod: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.put(
                `${API_URL}/expenses/${expenseData.id}`,
                {
                    category: expenseData.category,
                    description: expenseData.description,
                    amount: expenseData.amount,
                    expenseDate: expenseData.expenseDate,
                    expenseMonth: expenseData.expenseMonth,
                    expenseYear: expenseData.expenseYear,
                    paymentMethod: expenseData.paymentMethod,
                }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const deleteExpense = createAsyncThunk(
    "user/deleteExpense",
    async (expenseId: number, { rejectWithValue }) => {
        try {
            const response = await axios.delete(
                `${API_URL}/expenses/${expenseId}`
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getExpenseAnalytics = createAsyncThunk(
    "user/getExpenseAnalytics",
    async (year: number | undefined, { rejectWithValue }) => {
        try {
            const queryParams = year ? `?year=${year}` : "";
            const response = await axios.get(
                `${API_URL}/expenses/analytics${queryParams}`
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getExpenseCategories = createAsyncThunk(
    "user/getExpenseCategories",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/expenses/categories`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getMonthlyExpenseTotals = createAsyncThunk(
    "user/getMonthlyExpenseTotals",
    async (year: number, { rejectWithValue }) => {
        try {
            const response = await axios.get(
                `${API_URL}/expenses/monthly/${year}`
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const generateMonthlyReport = createAsyncThunk(
    "user/generateMonthlyReport",
    async (
        { month, year }: { month: number; year: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.get(
                `${API_URL}/reports/monthly/${month}/${year}`
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const exportMonthlyReport = createAsyncThunk(
    "user/exportMonthlyReport",
    async (
        { month, year }: { month: number; year: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.get(
                `${API_URL}/reports/monthly/${month}/${year}/export`,
                { responseType: "blob" }
            );

            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const monthName = new Date(year, month - 1).toLocaleString(
                "default",
                { month: "long" }
            );
            const fileName = `Monthly_Report_${monthName}_${year}.xlsx`;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode!.removeChild(link);
            window.URL.revokeObjectURL(url);

            return `Monthly report for ${monthName} ${year} downloaded successfully`;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getAllMonthlyBalances = createAsyncThunk(
    "user/getAllMonthlyBalances",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/reports/balances`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const getYearlySummary = createAsyncThunk(
    "user/getYearlySummary",
    async (year: number, { rejectWithValue }) => {
        try {
            const response = await axios.get(
                `${API_URL}/reports/yearly/${year}`
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const generateVillaReport = createAsyncThunk(
    "user/generateVillaReport",
    async (
        { villaId, year }: { villaId: number; year: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.get(
                `${API_URL}/reports/villa/${villaId}/${year}`
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const exportVillaReport = createAsyncThunk(
    "user/exportVillaReport",
    async (
        { villaId, year }: { villaId: number; year: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.get(
                `${API_URL}/reports/villa/${villaId}/${year}/export`,
                {
                    responseType: "blob",
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Villa_Report_${villaId}_${year}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const generatePendingPaymentsReport = createAsyncThunk(
    "user/generatePendingPaymentsReport",
    async (
        { month, year }: { month?: number; year?: number },
        { rejectWithValue }
    ) => {
        try {
            const params = new URLSearchParams();
            if (month) params.append("month", month.toString());
            if (year) params.append("year", year.toString());

            const response = await axios.get(
                `${API_URL}/reports/pending?${params.toString()}`
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
        }
    }
);

export const exportPendingPaymentsReport = createAsyncThunk(
    "user/exportPendingPaymentsReport",
    async (
        { month, year }: { month?: number; year?: number },
        { rejectWithValue }
    ) => {
        try {
            const params = new URLSearchParams();
            if (month) params.append("month", month.toString());
            if (year) params.append("year", year.toString());

            const response = await axios.get(
                `${API_URL}/reports/pending/export?${params.toString()}`,
                {
                    responseType: "blob",
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `Pending_Payments_${month || new Date().getMonth() + 1}_${year || new Date().getFullYear()}.xlsx`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || { error: "Something went wrong" }
            );
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
        builder.addCase(userLogout.fulfilled, (state, {}) => {
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
        builder.addCase(getVillaSummaries.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getVillaSummaries.fulfilled, (state, { payload }) => {
            state.loading = false;
            state.villas = payload.data;
        });
        builder.addCase(getVillaSummaries.rejected, (state, { payload }) => {
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
        builder.addCase(postVilla.fulfilled, (state, {}) => {
            state.loading = false;
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
        builder.addCase(deleteVilla.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(deleteVilla.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(deleteVilla.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(getVillaById.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getVillaById.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(getVillaById.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(getOccupiedVillas.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getOccupiedVillas.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(getOccupiedVillas.rejected, (state, { payload }) => {
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
            if (payload && payload.id) {
                state.user = payload;
                state.isLoggedIn = true;
            } else {
                state.isLoggedIn = false;
                state.user = {
                    id: 0,
                    email: "",
                    firstName: "",
                    lastName: "",
                };
            }
        });
        builder.addCase(updateUser.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(getPaymentCategories.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(
            getPaymentCategories.fulfilled,
            (state, { payload }) => {
                state.loading = false;
                state.paymentCategories = payload.data;
            }
        );
        builder.addCase(getPaymentCategories.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(createPaymentCategory.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(createPaymentCategory.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(
            createPaymentCategory.rejected,
            (state, { payload }) => {
                state.loading = false;
                state.error = payload as string;
            }
        );
        builder.addCase(updatePaymentCategory.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(updatePaymentCategory.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(
            updatePaymentCategory.rejected,
            (state, { payload }) => {
                state.loading = false;
                state.error = payload as string;
            }
        );
        builder.addCase(deletePaymentCategory.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(deletePaymentCategory.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(
            deletePaymentCategory.rejected,
            (state, { payload }) => {
                state.loading = false;
                state.error = payload as string;
            }
        );
        builder.addCase(getDashboardStats.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getDashboardStats.fulfilled, (state, {}) => {
            state.loading = false;
        });
        builder.addCase(getDashboardStats.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(getDashboardSummary.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getDashboardSummary.fulfilled, (state, {}) => {
            state.loading = false;
        });
        builder.addCase(getDashboardSummary.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(updateUserInfo.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(updateUserInfo.fulfilled, (state, { payload }) => {
            state.loading = false;
            if (payload.data) {
                state.user = { ...state.user, ...payload.data };
            }
        });
        builder.addCase(updateUserInfo.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(changePassword.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(changePassword.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(changePassword.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });

        builder.addCase(getExpenses.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getExpenses.fulfilled, (state, { payload }) => {
            state.loading = false;
            state.expenses = payload.data;
        });
        builder.addCase(getExpenses.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(createExpense.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(createExpense.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(createExpense.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(updateExpense.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(updateExpense.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(updateExpense.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(deleteExpense.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(deleteExpense.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(deleteExpense.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(getExpenseAnalytics.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getExpenseAnalytics.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(getExpenseAnalytics.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(getExpenseCategories.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getExpenseCategories.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(getExpenseCategories.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
        builder.addCase(getMonthlyExpenseTotals.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getMonthlyExpenseTotals.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(
            getMonthlyExpenseTotals.rejected,
            (state, { payload }) => {
                state.loading = false;
                state.error = payload as string;
            }
        );
        builder.addCase(generateMonthlyReport.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(generateMonthlyReport.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(
            generateMonthlyReport.rejected,
            (state, { payload }) => {
                state.loading = false;
                state.error = payload as string;
            }
        );

        builder.addCase(exportMonthlyReport.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(exportMonthlyReport.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(exportMonthlyReport.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });

        builder.addCase(getAllMonthlyBalances.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getAllMonthlyBalances.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(
            getAllMonthlyBalances.rejected,
            (state, { payload }) => {
                state.loading = false;
                state.error = payload as string;
            }
        );

        builder.addCase(getYearlySummary.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getYearlySummary.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(getYearlySummary.rejected, (state, { payload }) => {
            state.loading = false;
            state.error = payload as string;
        });
    },
});

export const userReducer = userSlice.reducer;
export const {} = userSlice.actions;
