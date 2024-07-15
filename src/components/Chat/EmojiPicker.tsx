"use client"
import React from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'
import { SmileIcon } from 'lucide-react'
import Picker from "@emoji-mart/react"
import data from "@emoji-mart/data"
import { useTheme } from 'next-themes'
const EmojiPicker = ({onChange}:{onChange:(emoji:string)=>void}) => {
    const { theme } = useTheme()
    return (
        <Popover>
            <PopoverTrigger asChild>
                <SmileIcon className='h-6 w-6 text-muted-foreground hover:text-foreground transition' />
            </PopoverTrigger>
            <PopoverContent className='w-full'>
                <Picker
                    emojiSize={24}
                    data={data}
                    maxFrequencies={1}
                    theme={theme === "light" ? "light" : "dark"}
                    onEmojiSelect={(emoji:any)=>onChange(emoji.native)}
                />

            </PopoverContent>
        </Popover>
    )
}

export default EmojiPicker
