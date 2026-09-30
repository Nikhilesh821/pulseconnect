"use client"
import { Button } from '@/components/ui/button'
import { Inria_Sans } from 'next/font/google'
import React, { useState } from 'react'
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";


const inria2 = Inria_Sans({
    display: 'swap',
    subsets: ['latin'],
    weight: ["300", "400", "700"]
})
const AuthButtons = () => {
    const [isLoading, setIsLoading] = useState(false)
    return (
        <div className='flex flex-col gap-4 mt-12 w-full max-w-md relative z-50'>
            <Button
                onClick={() => {
                    setIsLoading(true);
                    document.cookie = "demo_user=true; path=/; max-age=86400";
                    window.location.href = "/";
                }}
                disabled={isLoading}
                className={"w-full text-lg font-bold py-6 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-90 text-white shadow-lg cursor-pointer transition-all " + (inria2.className)}
            >
                🚀 Launch Live Demo (Instant Access)
            </Button>
            <div className='flex gap-3 md:flex-row flex-col'>
                <Button asChild disabled={isLoading} className={"w-full text-md font-medium py-5 rounded-full " + (inria2.className)} variant={"outline"}>
                    <RegisterLink onClick={() => setIsLoading(true)}>
                        Sign Up with Email
                    </RegisterLink>
                </Button>
                <Button asChild disabled={isLoading} className={"w-full text-md font-medium py-5 rounded-full " + (inria2.className)} variant={"secondary"}>
                    <LoginLink onClick={() => setIsLoading(true)}>
                        Sign In
                    </LoginLink>
                </Button>
            </div>
        </div>
    )

}

export default AuthButtons
