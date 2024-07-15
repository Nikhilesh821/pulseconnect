import { Inria_Sans } from 'next/font/google'
import React from 'react'
import { ScrollArea } from './ui/scroll-area'
import { Tooltip, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Avatar, AvatarFallback } from './ui/avatar'
import { AvatarImage } from '@radix-ui/react-avatar'
import { TooltipContent } from '@radix-ui/react-tooltip'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { LogOutIcon } from 'lucide-react'
import useSound from 'use-sound'
import { usePreferences } from '@/store/usePrefrences'
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components'
import { User } from '@/types/user'
import { useSelectedUser } from '@/store/useSelectedUser'
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"



const Sidebar = ({ isCollapsed, users }: { isCollapsed: boolean, users: User[] }) => {
    const { selectedUser, setSelectedUser } = useSelectedUser()
    const [playClickSound] = useSound('/sounds/mouse-click.mp3')
    const { soundEnabled } = usePreferences()
    const { user } = useKindeBrowserClient()
    if(user?.picture?.includes("gravatar")){
        user.picture=`https://avatar.iran.liara.run/public/boy?username=${user?.given_name}`
    }
    return (
        <div className='relative ml-1 flex flex-col gap-4 p-2 h-full data-[collapsed=true]:p-2 max-h-full overflow-auto bg-background'>
            {
                !isCollapsed && (
                    <div className='flex justify-between p-2 items-center'>
                        <div className='flex gap-2 items-center text-2xl'>
                            <p className={'font-medium '}>
                                Chats
                            </p>
                        </div>
                    </div>
                )
            }
            <ScrollArea className='gap-2 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2'>
                {
                    users.map((user, index) => (

                        isCollapsed ? (
                            <TooltipProvider key={index}>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <div onClick={() => {
                                            soundEnabled && playClickSound()
                                            setSelectedUser(user)
                                        }}>
                                            <Avatar className='my-4 flex justify-center items-center'>
                                                <AvatarImage alt="user_image" className='border-2 border-gray-400 justify-center rounded-full w-10 h-10' src={user.image} />
                                                <AvatarFallback className='font-bold'>
                                                    {user.name.split(" ")[0].charAt(0) + user.name.split(" ")[1].charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className={"sr-only " }>
                                                {user.name}

                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side='left' className={'flex items-center mr-6 ' }>
                                        {user.name}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : <Button onClick={() => {
                            soundEnabled && playClickSound()
                            setSelectedUser(user)
                        }} variant={"grey"} size={"xl"} className={cn("w-full justify-start rounded-full gap-4 my-1.5", selectedUser?.email === user.email && "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink")} key={index}>
                            <Avatar className=' flex justify-center items-center'>
                                <AvatarImage alt="user_image" className=' w-10 h-10' src={user.image} />
                                <AvatarFallback className='font-bold'>
                                    {user.name.split(" ")[0].charAt(0) + user.name.split(" ")[1].charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col font-medium max-w-28'>
                                <span className={"text-lg "}>
                                    {user.name}

                                </span>
                            </div>

                        </Button>
                    ))
                }

            </ScrollArea>
            {/* logout */}
            <div className='mt-auto' >
                <div className='flex justify-between items-center gap-2 md:px-2 py-4'>
                    {!isCollapsed && (
                        <div className='hidden md:flex gap-2 items-center'>
                            <Avatar className='my-1 flex justify-center items-center'>
                                <AvatarImage referrerPolicy='no-referrer' alt="user_image" className='border-2 border-gray-400 justify-center rounded-full w-10 h-10' src={user?.picture || '/user-placeholder.png'} />
                            </Avatar>
                            <p className={'font-semibold ' + ("text-lg ")}>
                                {user?.given_name} {user?.family_name}
                            </p>
                        </div>
                    )
                    }
                    <div className='flex justify-center'>
                        <LogoutLink>
                            <LogOutIcon className='cursor-pointer ml-2' size={28} />
                        </LogoutLink>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Sidebar
