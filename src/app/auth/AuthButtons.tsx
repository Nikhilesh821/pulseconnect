"use client"
import { Button } from '@/components/ui/button'
import { Inria_Sans } from 'next/font/google'
import React, { useState } from 'react'
import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";


const inria2 = Inria_Sans({
    display: 'swap',
    subsets: ['latin'],
    weight: ["300", "400", "700"]
})
const AuthButtons = () => {
    const [isLoading,setIsLoading]=useState(false)
    return (
        <div className='flex gap-3 mt-20 md:flex-row flex-col relative z-50'>
            <Button disabled={isLoading} className={"w-full text-lg font-medium py-5 rounded-full "+(inria2.className)} variant={"outline"}>
                <RegisterLink onClick={()=>setIsLoading(true)}>
                    Sign Up
                </RegisterLink>
            </Button>
            <Button disabled={isLoading} className={"w-full text-lg font-medium py-5 rounded-full "+(inria2.className)} variant={"secondary"}>
                <LoginLink onClick={()=>setIsLoading(true)}>
                    Sign In
                </LoginLink>
            </Button>
            
        </div>
    )
}

export default AuthButtons
