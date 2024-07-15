import { Inria_Sans, Inria_Serif } from 'next/font/google'
import Image from 'next/image'
import React from 'react'
import AuthButtons from './AuthButtons'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'


const inria = Inria_Serif({
    display: 'swap',
    subsets: ['latin'],
    weight: ["300", "400", "700"]
})
const inria2 = Inria_Sans({
    display: 'swap',
    subsets: ['latin'],
    weight: ["300", "400", "700"]
})
const Page = async() => {
    const {isAuthenticated}=getKindeServerSession()
    if(await isAuthenticated()){
        return redirect('/')
    }
    return (
        <div className='flex h-screen w-full'>
            <div className='flex-1 flex overflow-hidden  bg-[#000000] justify-center relative items-center' >
                <img src='/logos/logo.svg' alt='logo' className='absolute opacity-20 -left-1/4 -bottom-0 lg:scale-150 xl:scale-200 scale-[2] pointer-events-none select-none -z-1' />
                <div className='flex flex-col gap-1 xl:ml-20 text-center md:text-start justify-center font-semibold'>
                    <Image className=' w-[420px] z-0 mb-1 pointer-events-none select-none' src={"/onlyChatie.svg"} alt='chatie_logo' width={800} height={200} />
                    <p className={'text-2xl mt-3 text-center md:text-3xl text-balance z-10 text-gray-300 '+(inria.className)}>
                        The <span className='px-1 font-bold text-pink-500'>MODERN</span> Chat App
                    </p>
                    <p className={'text-2xl text-center md:text-3xl text-balance z-10 text-gray-300 '+(inria.className)}>
                        You <span className='px-1 text-blue-500 font-bold '>NEED TO</span> Have
                    </p>
                    <AuthButtons/>
                </div>
            </div>
            <div className='flex-1 relative overflow-hidden justify-center items-center hidden md:flex'>
            <Image className='object-cover pointer-events-none select-none' src={"/bg_left.jpeg"} alt='image' fill/>
            </div>
        </div>
    )
}

export default Page
