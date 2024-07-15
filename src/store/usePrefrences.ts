import { create } from "zustand"

interface Preferences{
    soundEnabled:boolean,
    setSoundEnabled:(soundEnabled:boolean)=>void
}
export const usePreferences = create<Preferences>((set) => (
    {
        soundEnabled: true,
        setSoundEnabled: (soundEnabled: boolean) => set({ soundEnabled })
    }
))