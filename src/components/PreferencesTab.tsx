"use client"
import { Button } from './ui/button'
import { MoonIcon, SunIcon, Volume2, VolumeX } from "lucide-react"
import { useTheme } from 'next-themes'
import { usePreferences } from '@/store/usePrefrences'
import { useSound } from "use-sound"

const PreferencesTab = () => {
    const { setTheme } = useTheme()
    const { soundEnabled, setSoundEnabled } = usePreferences()
    const [playMouseClick] = useSound("/sounds/mouse-click.mp3")
    const [playSoundOn] = useSound("/sounds/sound-on.mp3", { volume: 0.5 })
    const [playSoundOff] = useSound("/sounds/sound-off.mp3", { volume: 0.5 })

    return (
        <div className='flex px-1 gap-2 md:px-2'>
            <Button onClick={() => {
                    soundEnabled && playMouseClick()
                    setTheme("light")
                }} variant={"outline"} size={"icon"}>
                <SunIcon className="size-[1.2rem] text-muted-foreground" />
            </Button>
            <Button onClick={() => {
                soundEnabled && playMouseClick()
                setTheme("dark")
            }} variant={"outline"} size={"icon"}>
                <MoonIcon className="size-[1.2rem] text-muted-foreground" />
            </Button>
            <Button onClick={() => {
                soundEnabled? playSoundOff(): playSoundOn()
                setSoundEnabled(!soundEnabled)
                
            }} variant={"outline"} size={"icon"}>
                {
                    soundEnabled ? <Volume2 className="size-[1.2rem] text-muted-foreground" /> : <VolumeX className="size-[1.2rem] text-muted-foreground" />
                }
            </Button>
        </div>
    )
}

export default PreferencesTab
