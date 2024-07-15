import { User } from "@/types/user";
import { create } from "zustand";

interface SelectedUserState{
    selectedUser:User|null,
    setSelectedUser:(selectedUser:User|null)=>void
}
export const useSelectedUser=create<SelectedUserState>((set)=>({
    selectedUser: null,
    setSelectedUser:(selectedUser:User|null)=>set({selectedUser})
}))