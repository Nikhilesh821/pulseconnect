"use client"
import { checkAuthStatus } from '@/actions/auth.actions'
import { useQuery } from '@tanstack/react-query'
import { LoaderPinwheel, Router } from 'lucide-react'
import { Inria_Sans, Inria_Serif } from 'next/font/google'
import { useRouter } from 'next/navigation'
import React from 'react'


const inria2 = Inria_Sans({
    display: 'swap',
    subsets: ['latin'],
    weight: ["300", "400", "700"]
})
const inria = Inria_Serif({
    display: 'swap',
    subsets: ['latin'],
    weight: ["300", "400", "700"]
})

const Page = () => {
    const router=useRouter()
    const {data}=useQuery({
        queryKey:['authCheck'],
        queryFn:async ()=>await checkAuthStatus()
    })
    if(data?.success){
        router.push('/')
    }
    return (
        <div className='mt-10 w-full flex justify-center'>
            <div className='flex flex-col items-center gap-2'>
                <LoaderPinwheel className='w-20 h-10 animate-spin text-muted-foreground'/>
                <h3 className={'text-xl font-bold '+(inria2.className) }>
                    Redirecting...
                </h3>
                <p className={inria.className}>Please Wait</p>
            </div>
        </div>
    )
}

export default Page
