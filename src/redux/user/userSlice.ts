import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import type { userState } from "@/types";
import axios from "axios";

const initialState:userState = {
    user:{
        id:0,
        email:'',
        firstName:'',   
        lastName:'',
    },
    isLoggedIn:false,
    loading:false,
    error:""
}

export const userLogin = createAsyncThunk('user/login', async (credentials: { email: string, password: string }, { rejectWithValue }) => {
    try {
        
        const res = await axios.post("/api/login", credentials);
        return res.data;

    } catch (err: any) {
        if (err.response && err.response.data) {
            return rejectWithValue(err.response.data);
        }
        return rejectWithValue({ error: 'Something went wrong' });
    }
});

export const userSignup = createAsyncThunk('user/userSignup', async (credentials: { email: string, password: string, firstName: string, lastName:string }, { rejectWithValue }) => {
    try {
        const res = await axios.post("/api/users", credentials);
        return res.data;
    } catch (err: any) {
        if (err.response && err.response.data) {
            return rejectWithValue(err.response.data);
        }
        return rejectWithValue({ error: 'Something went wrong' });
    }
});

export const userLogout = createAsyncThunk('user/logout',async (_,{rejectWithValue})=>{
    try {
        const res = await axios.get("/api/logout");
        return res.data;

    } catch (error:any) {
        return rejectWithValue({ error: 'Something went wrong' });
    }
});

export const checkUserLogin = ()=>{
    try {
        const user = localStorage.getItem('user');
        if(user) return user;
        return;
    } catch (err: any) {
       return;
    }
};


const userSlice = createSlice({
    initialState,
    name: `user`,
    reducers: {
        updateUser: (state, action) => {
            state.user = action.payload;
            state.isLoggedIn = true;
        },
    },
    extraReducers:(builder) => {
        builder.addCase(userLogin.pending,(state)=>{
            state.loading=true;
        });
        builder.addCase(userLogin.fulfilled,(state,{payload})=>{
            state.loading=false;
            state.user=payload.data;
            localStorage.setItem('user',JSON.stringify(payload.data));

            state.isLoggedIn = true;
        });
        builder.addCase(userLogin.rejected,(state,{payload})=>{
            state.loading=false;
            state.error=payload as string;
        });
        builder.addCase(userSignup.pending,(state)=>{
            state.loading=true;
        });
        builder.addCase(userSignup.fulfilled,(state,{})=>{
            state.loading=false;
        });
        builder.addCase(userSignup.rejected,(state,{payload})=>{
            state.loading=false;
            state.error=payload as string;
        });
        builder.addCase(userLogout.pending,(state)=>{
            state.loading=true;
        });
        builder.addCase(userLogout.fulfilled,(state,{payload})=>{
            state.loading=false;
            state.user={
                id:0,
                email:'',
                firstName:'',   
                lastName:'',
            };
            localStorage.removeItem('user');
            state.isLoggedIn = false;
            window.location.href = "/";
        });
        builder.addCase(userLogout.rejected,(state,{payload})=>{
            state.loading=false;
            state.error=payload as string;
        });
    },
})


export const userReducer = userSlice.reducer;
export const { updateUser } = userSlice.actions;


