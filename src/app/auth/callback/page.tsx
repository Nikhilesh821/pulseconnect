"use client"
import { useEffect } from 'react'
import { checkAuthStatus } from '@/actions/auth.actions'
import { useQuery } from '@tanstack/react-query'
import { LoaderPinwheel } from 'lucide-react'
import { Inria_Sans, Inria_Serif } from 'next/font/google'
import { useRouter } from 'next/navigation'


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
    const router = useRouter()
    const { data, error } = useQuery({
        queryKey: ['authCheck'],
        queryFn: async () => await checkAuthStatus(),
        retry: 2,
    })
    useEffect(() => {
        if (data?.success) {
            router.push('/')
        } else if (data && !data.success) {
            router.push('/auth')
        } else if (error) {
            router.push('/auth')
        }
    }, [data, error, router])
    return (
        <div className='mt-10 w-full flex justify-center'>
            <div className='flex flex-col items-center gap-2'>
                <LoaderPinwheel className='w-20 h-10 animate-spin text-muted-foreground' />
                <h3 className={'text-xl font-bold ' + (inria2.className)}>
                    Redirecting...
                </h3>
                <p className={inria.className}>Please Wait</p>
            </div>
        </div>
    )
}

export default Page
