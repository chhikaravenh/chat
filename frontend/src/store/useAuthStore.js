import {create} from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/"

export const useAuthStore = create((set, get)=>({
    authUser: null,
    isCheckingAuth: true,

    isSigningUp:false,
    isLoggingIn:false,
    isUpdatingProfile:false,
    isCheckingAuth:false,
    onlineUsers: [],
    socket : null,

    checkAuth:async ()=>{
        try {
            const res = await axiosInstance.get("/auth/check")
            set((state)=>({...state, authUser:res.data}))
            get().connectSocket()
        } catch (error) {
            console.log("Error in checkAuth in useAuthStore \n",error)
            set({authUser:null})
        }finally{
            set({isCheckingAuth:false})
        }
    },
    
    signUp: async(data)=>{
        console.log(data)
        set((state)=>({...state, isSigningUp:true}))
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({authUser: res.data});
            toast.success("user has been created successfully");
            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message)
            console.log("Error in the signUp function in useAuthStore:",error.message)
        }finally{
            set({isSigningUp: false })
        }
    },

    login: async(data)=>{
        set({isLogginIn: true});

        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({authUser: res.data});
            toast.success("logged in  successfully");
            get().connectSocket()
        } catch (error) {
            toast.error(error.response.data.message);
        }finally{
            set({isLogginIn: false});
        }
    },

    logout: async()=>{
        try {
            await axiosInstance.post("/auth/logout");
            set({authUser: null});
            toast.success("Logged out successfully")
            get().disconnectSocket()
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    updateProfile : async(data)=>{
        set({isUpdatingProfile: true});
        try {
            const res = await axiosInstance.put("/auth/update-profile", data)
            set({authUser: res.data});
            toast.success("successfully update profile pic")
            
        } catch (error) {
            console.log("error in the updateProfile in useAuthStore", error);
            toast.error(error.response.data.message);
        }finally{
            set({isUpdatingProfile: false})
        }
    },

    connectSocket : ()=>{
        const {authUser} = get()
        if(!authUser || get().socket?.connected) return ;

        const socket = io(BASE_URL,{
            query: {
                userId : authUser._id
            }
        });
        socket.connect()
        set({socket: socket})

        socket.on("getOnlineUsers", (userIds)=>{
            set({onlineUsers: userIds})
        })
    },

    disconnectSocket : ()=>{
        if(get().socket?.connected) get().socket.disconnect()
    }
})
);