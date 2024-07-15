import React, { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from "framer-motion"
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage } from '@radix-ui/react-avatar'
import { Inria_Serif } from 'next/font/google'
import { useSelectedUser } from '@/store/useSelectedUser'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { useQuery } from '@tanstack/react-query'
import { getMessageAction } from '@/actions/message.actions'
import MessageSkeleton from '../skeletons/MessageSkeleton'

const inria2 = Inria_Serif({
  display: 'swap',
  subsets: ['latin'],
  weight: ["300", "400", "700"]
})

const MessageList = () => {
  const {selectedUser}=useSelectedUser()
  const messageContainerRef=useRef<HTMLDivElement>(null)
  const {user:currentUser,isLoading:isUserLoading} = useKindeBrowserClient()
  if(currentUser?.picture?.includes("gravatar")){
    currentUser.picture=`https://avatar.iran.liara.run/public/boy?username=${currentUser?.given_name}`
  }
  const {data:messages,isLoading:isMessagesLoading}=useQuery({
    queryKey: ['messages',selectedUser?.id],
    queryFn: async () => {
      if(selectedUser && currentUser){
        return await getMessageAction(selectedUser.id,currentUser.id)
      }
    },
  
    enabled:!!selectedUser && !!currentUser && !isUserLoading 
    // by putting !! we can change an object to corresponding boolean value and we use enabled because useQuery runs immediately as soon as the component messageList is mounted so it ensures that until we do not get the values don't run
  })

  //scroll to bottom of the message list after selecting any chat
  useEffect(()=>{
    if(messageContainerRef.current){
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior:'smooth'
      })
    }
  },[messages])
  return (
    <div ref={messageContainerRef} className='w-full overflow-y-auto overflow-x-hidden h-full flex flex-col'>
      {/* This component ensures that an animation is applied when items are added to or removed from the list */}
      <AnimatePresence>
        {!isMessagesLoading&& messages?.map((message, index) => (
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
                duration: index * messages!.indexOf(message) * 0.05 + 0.2
              }
            }}
            style={{
              originX: 0.5,
              originY: 0.5,

            }}

            className={cn("flex flex-col gap-2 p-4 whitespace-pre-wrap", message.senderId === currentUser?.id ? "items-end" : "items-start")}
          >
            <div className='flex gap-3 items-center'>
              {message.senderId == selectedUser?.id && (
                <Avatar className='flex justify-center items-center'>
                  <AvatarImage src={selectedUser?.image} alt="user_image" className='border-1 border-gray-400 rounded-full w-10 h-10 object-cover' />
                </Avatar>
              )}
              {
                message.messageType === "text" ? (
                  <span className={'bg-accent p-3 rounded-full max-w-25 '+(inria2.className) }>
                    {message.content}
                  </span>
                ) : (<img src={message.content} alt='message_image' className='border p-2 rounded-lg h-40 md:h-52 object-cover' />)
              }

              {message.senderId == currentUser?.id && (
                <Avatar className='flex justify-center items-center'>
                  <AvatarImage src={currentUser?.picture!} alt="user_image" className='border-1 border-gray-400 rounded-full w-10 h-10 object-cover' />
                </Avatar>
              )}

            </div>
          </motion.div>
        ))}

        {isMessagesLoading&&(
          <>
          <MessageSkeleton/>
          <MessageSkeleton/>
          <MessageSkeleton/>
          <MessageSkeleton/>
          <MessageSkeleton/>
          </>
        )}

      </AnimatePresence>
    </div>
  )
}

export default MessageList
