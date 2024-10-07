import { store } from "./redux/store";

export type userState = {
    user:User,
    isLoggedIn: boolean,
    error:string,
    loading:boolean
}

export type User = {
    id:number
    firstName:string
    lastName:string
    email:string
}



export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;