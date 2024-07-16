import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from "framer-motion"
import { Image as ImageIcon, Loader, SendHorizonalIcon, ThumbsUpIcon, Video } from 'lucide-react'
import { Textarea } from '../ui/textarea'
import { Inria_Sans, Inria_Serif } from 'next/font/google'
import EmojiPicker from './EmojiPicker'
import { Button } from '../ui/button'
import useSound from 'use-sound'
import { usePreferences } from '@/store/usePrefrences'
import { useMutation } from '@tanstack/react-query'
import { sendMessageAction } from '@/actions/message.actions'
import { useSelectedUser } from '@/store/useSelectedUser'
import { CldUploadWidget, CloudinaryUploadWidgetInfo } from 'next-cloudinary';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import Image from 'next/image'
import { queryClient } from '../Providers/TanStackProvider'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { pusherClient } from "@/lib/pusher"
import { Message } from '@/types/message'
import { CldVideoPlayer } from 'next-cloudinary';
import 'next-cloudinary/dist/cld-video-player.css';


const inria2 = Inria_Serif({
  display: 'swap',
  subsets: ['latin'],
  weight: ["300", "400", "700"]
})
const inria = Inria_Sans({
  display: 'swap',
  subsets: ['latin'],
  weight: ["300", "400", "700"]
})
const ChatBottomBar = () => {
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [playSound1] = useSound('/sounds/keystroke1.mp3')
  const [playSound2] = useSound('/sounds/keystroke2.mp3')
  const [playSound3] = useSound('/sounds/keystroke3.mp3')
  const [playSound4] = useSound('/sounds/keystroke4.mp3')
  const [playNotificationSound] = useSound('/sounds/notification.mp3')
  const { user: currentUser } = useKindeBrowserClient()
  const playSoundFunctions = [playSound1, playSound2, playSound3, playSound4]
  const { soundEnabled } = usePreferences()
  const { selectedUser } = useSelectedUser()
  const [imageUrl, setImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [display,setDisplay]=useState(true)
  const playRandomKeyStroke = () => {
    const randomIndex = Math.floor(Math.random() * playSoundFunctions.length)
    soundEnabled && playSoundFunctions[randomIndex]()
  }
  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: sendMessageAction,
    // onSuccess:()=>{
    //   queryClient.invalidateQueries({queryKey:["messages"]})
    // }
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }

    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      setMessage(message + '\n')
    }
  }
  const handleSendMessage = () => {
    if (!message.trim()) return

    sendMessage({
      content: message,
      messageType: "text",
      receiverId: selectedUser?.id!,
    })
    setMessage("")
    inputRef.current?.focus()
  }

  useEffect(() => {
    const channelName = `${currentUser?.id}__${selectedUser?.id}`.split('__').sort().join('__')
    const channel = pusherClient?.subscribe(channelName)
    const handleNewMessage = (data: { message: Message }) => {
      queryClient.setQueryData(["messages", selectedUser?.id], (oldMessages: Message[]) => {
        return [...oldMessages, data.message];
      });
      if (soundEnabled && data.message.senderId !== currentUser?.id) {
        playNotificationSound()
      }
    }


    channel.bind("newMessage", handleNewMessage)
    //this cleanup is necessary otherwise the event listener will be added multiple times which means you'll see the incoming message multiple times
    return () => {
      channel.unbind("newMessage", handleNewMessage)
      pusherClient.unsubscribe(channelName)
    }

  }, [currentUser?.id, selectedUser?.id, queryClient, playNotificationSound, soundEnabled])
  return (
    <>
      <div className='p-4 flex justify-between w-full items-center gap-2 '>
        {!message.trim() && (
          <CldUploadWidget
            onSuccess={(result, { widget }) => {
              setImageUrl((result.info as CloudinaryUploadWidgetInfo).secure_url)
              widget.close()
            }}
            signatureEndpoint="/api/sign-cloudinary-params">
            {({ open }) => {
              return (
                <ImageIcon onClick={() => open()} size={24} className='cursor-pointer text-muted-foreground' />
              );
            }}
          </CldUploadWidget>
        )}
        {!message.trim() && (
          <CldUploadWidget
            onSuccess={(result, { widget }) => {
              setVideoUrl((result.info as CloudinaryUploadWidgetInfo).secure_url)
              widget.close()
            }}
            signatureEndpoint="/api/sign-cloudinary-params">
            {({ open }) => {
              return (
                <Video onClick={() => open()} size={24} className='cursor-pointer text-muted-foreground' />
              );
            }}
          </CldUploadWidget>
        )}


        <AnimatePresence>
          <motion.div
            layout
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{
              opacity: { duration: 0.5 },
              layout: {
                type: "spring",
                bounce: 0.15
              }
            }}
            className='w-full relative'
          >
            <Textarea onKeyDown={handleKeyDown} ref={inputRef} onChange={(e) => {
              setMessage(e.target.value)
              playRandomKeyStroke()
            }} value={message} autoComplete='off' placeholder='Type your message here..' rows={1} className={'w-full border rounded-full items-center h-10 py-2 resize-none overflow-hidden bg-background min-h-0 ' + (inria2.className)} />
            <div className="absolute right-2 bottom-2">
              <EmojiPicker onChange={(emoji) => {
                setMessage(message + emoji)
                if (inputRef.current) {
                  inputRef.current.focus()
                }
              }} />
            </div>
          </motion.div>
          {message.trim() ? (
            <Button onClick={handleSendMessage} className='h-9 w-9 dark:bg-muted dark:text-muted dark:hover:bg-muted dark:hover:text-white shrink-0' variant={"ghost"} size={"icon"} >
              <SendHorizonalIcon size={20} className='text-muted-foreground' />
            </Button>
          ) : (
            <Button className='h-9 w-9 dark:bg-muted dark:text-muted dark:hover:bg-muted dark:hover:text-white shrink-0' variant={"ghost"} size={"icon"}>
              {!isPending ? <ThumbsUpIcon onClick={() => {
                sendMessage({
                  content: "👍🏻",
                  messageType: "text",
                  receiverId: selectedUser?.id!,
                })
              }} size={20} className='text-muted-foreground' /> : <Loader size={20} className='text-muted-foreground animate-spin' />}
            </Button>
          )}
        </AnimatePresence>

      </div>
      <Dialog open={!!imageUrl && videoUrl === ""}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={inria.className}>Image Preview</DialogTitle>
          </DialogHeader>
          <div className='flex justify-center items-center rounded-lg relative h-96 w-full mx-auto'>
            (<Image src={imageUrl} alt='Image Preview' fill className='object-contain rounded-lg' />
            )
          </div>

          <DialogFooter>
            <Button
              className={"w-full rounded-full md:text-lg font-semibold " + (inria.className)}
              type='submit'
              onClick={() => {
                sendMessage({ content: imageUrl, messageType: "image", receiverId: selectedUser?.id! });
                setImageUrl("");
              }}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>
      <Dialog open={!!videoUrl && imageUrl === "" && display}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={inria.className}>Video Preview</DialogTitle>
          </DialogHeader>
          <div className='flex justify-center items-center rounded-lg relative h-96 w-full mx-auto'>
          <CldVideoPlayer className='rounded-lg' width={150} height={96} src={videoUrl} />
          </div>

          <DialogFooter>
            <Button
              className={"w-full rounded-full md:text-lg font-semibold " + (inria.className)}
              type='submit'
              onClick={() => {
                sendMessage({ content: videoUrl, messageType: "video", receiverId: selectedUser?.id! });
                setDisplay(false)
              }}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>
    </>
  )
}

export default ChatBottomBar
