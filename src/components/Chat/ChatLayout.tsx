"use client"
import { useEffect, useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { cn } from '@/lib/utils'
import { Inria_Sans } from 'next/font/google'
import Sidebar from '../Sidebar'
import MessageContainer from './MessageContainer'
import { User } from '@/types/user'
import { useSelectedUser } from '@/store/useSelectedUser'


const inria2 = Inria_Sans({
    display: 'swap',
    subsets: ['latin'],
    weight: ["300", "400", "700"]
})


const ChatLayout = ({ defaultLayout = [20, 80], users }: { defaultLayout: number[] | undefined, users: User[] }) => {
    const [isMobile, setIsMobile] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const { selectedUser } = useSelectedUser()
    useEffect(() => {
        const checkScreenWidth = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        checkScreenWidth()
        window.addEventListener("resize", checkScreenWidth)
        return () => {
            window.removeEventListener("resize", checkScreenWidth)
        }
    }, [])
    return (
        <ResizablePanelGroup
            direction='horizontal'
            className='h-full items-stretch bg-background rounded-lg'

        >
            <ResizablePanel
                className={cn(collapsed && !isMobile && "min-w-[80px] transition-all duration-300 ease-in-out")}
                defaultSize={defaultLayout[0]}
                collapsedSize={isMobile ? 0 : 6}
                collapsible={true}
                minSize={isMobile ? 0 : 20}
                maxSize={isMobile ? 20 : 20}
                onCollapse={() => {
                    setCollapsed(true)

                }}
                onExpand={() => {
                    setCollapsed(false)
                }}
            >
                <Sidebar users={users} isCollapsed={isMobile || collapsed} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
                defaultSize={defaultLayout[1]}
                minSize={30}
            >
                {!selectedUser && (<div className='flex flex-row justify-center items-center h-full w-full px-10'>
                    <div className='flex flex-col justify-center items-center gap-4'>
                        <img src='/onlyChatie.svg' alt='logo' className='w-full  md:w-2/3 lg:w-1/2' />
                        <p className={'text-muted-foreground md:text-lg text-md text-center ' + (inria2.className)}>
                            Click on a chat to view the messages
                        </p>
                    </div>
                </div>)}
                {selectedUser && <MessageContainer />}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}

export default ChatLayout
