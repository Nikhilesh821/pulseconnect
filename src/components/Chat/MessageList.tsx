"use client"
import React, { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from "framer-motion"
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Inria_Serif } from 'next/font/google'
import { useSelectedUser } from '@/store/useSelectedUser'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { useQuery } from '@tanstack/react-query'
import { getMessageAction } from '@/actions/message.actions'
import MessageSkeleton from '../skeletons/MessageSkeleton'
import { CldVideoPlayer } from 'next-cloudinary'
import 'next-cloudinary/dist/cld-video-player.css';
import { getReadableTime } from "@/lib/dateTime"

const inria2 = Inria_Serif({
  display: 'swap',
  subsets: ['latin'],
  weight: ["300", "400", "700"]
})

const MessageList = () => {
  const { selectedUser } = useSelectedUser()
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const { user: kindeUser, isLoading: isUserLoading } = useKindeBrowserClient()
  const currentUser = kindeUser || {
    id: "demo-user-1",
    given_name: "Nikhilesh",
    picture: "https://avatar.iran.liara.run/public/boy?username=Nikhilesh"
  }
  if (currentUser?.picture?.includes("gravatar")) {
    currentUser.picture = `https://avatar.iran.liara.run/public/boy?username=${currentUser?.given_name}`
  }
  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages', selectedUser?.id],
    queryFn: async () => {
      if (selectedUser && currentUser) {
        const res = await getMessageAction(selectedUser.id, currentUser.id)
        return Array.isArray(res) ? res : []
      }
      return []
    },

    enabled: !!selectedUser

    // by putting !! we can change an object to corresponding boolean value and we use enabled because useQuery runs immediately as soon as the component messageList is mounted so it ensures that until we do not get the values don't run
  })

  //scroll to bottom of the message list after selecting any chat
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])


  return (
    <div ref={messageContainerRef} className='w-full overflow-y-auto overflow-x-hidden h-full flex flex-col'>
      {/* This component ensures that an animation is applied when items are added to or removed from the list */}
      <AnimatePresence>
        {!isMessagesLoading && Array.isArray(messages) && messages.map((message, index) => (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
            transition={{
              opacity: { duration: 0.1 },
              layout: {
                ease: 'easeOut',
                type: 'spring',
                damping: 15,
                bounce: 0.3,
                duration: 0.25
              }
            }}

            style={{
              originX: 0.5,
              originY: 0.5,

            }}

            className={cn("flex flex-col gap-2 p-4", message.senderId === currentUser?.id ? "items-end" : "items-start")}
          >
            <div className={cn("flex flex-col gap-1 max-w-[90%] md:max-w-[80%]", message.senderId === currentUser?.id ? "items-end" : "items-start")}>
              <div className={cn("flex gap-3 items-end", message.senderId === currentUser?.id ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar (always first in JSX, position handled by flex-direction) */}
                <Avatar className='flex justify-center items-center mb-5 h-10 w-10 shrink-0'>
                  <AvatarImage
                    src={message.senderId === currentUser?.id ? (currentUser?.picture || undefined) : (selectedUser?.image || undefined)}
                    alt="avatar"
                    className='rounded-full object-cover'
                  />
                  <AvatarFallback>
                    {message.senderId === currentUser?.id ? (currentUser?.given_name?.[0] || "M") : (selectedUser?.name?.[0] || "U")}
                  </AvatarFallback>
                </Avatar>

                {message.messageType === "text" ? (
                  <span className={cn('bg-accent p-3 rounded-2xl shadow-sm whitespace-pre-wrap wrap-break-word font-medium mb-5', inria2.className)}>
                    {message.content}
                  </span>
                ) : message.messageType === "image" ? (
                  <img src={message.content} alt='message_image' className='rounded-2xl h-40 md:h-52 object-contain cursor-pointer bg-accent/50 max-w-full shadow-sm mb-5' />
                ) : message.messageType === "video" ? (
                  <div className='w-full max-w-[280px] md:max-w-xs rounded-2xl overflow-hidden shadow-sm mb-5 bg-black'>
                    <video
                      controls
                      className='h-full w-full'
                      src={message.content}
                    />
                  </div>
                ) : null}
              </div>


              {/* Timestamp outside the avatar-bubble row */}
              <p className={cn('text-muted-foreground text-[10px] mt-[-18px]', message.senderId === currentUser?.id ? "mr-12" : "ml-12")}>
                {getReadableTime(message.timeStamp)}
              </p>
            </div>
          </motion.div>
        ))}

        {isMessagesLoading && (
          <div key="loading-skeletons">
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        )}

      </AnimatePresence>
    </div>
  )
}

export default MessageList
