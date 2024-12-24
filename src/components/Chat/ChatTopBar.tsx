import { useSelectedUser } from '@/store/useSelectedUser'
import { Avatar, AvatarImage } from '@radix-ui/react-avatar'
import { InfoIcon, X } from 'lucide-react'
import React from 'react'
import useSound from 'use-sound'



const ChatTopBar = () => {
  const { selectedUser, setSelectedUser } = useSelectedUser()
  const [playSound] = useSound('/sounds/mouse-click.mp3')
  const addAudioElement = (blob: any) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    document.body.appendChild(audio);
  };
  return (
    <div className='w-full h-20 flex p-4 justify-between items-center border-b'>
      <div className='flex items-center gap-2'>
        <Avatar className=''>
          <AvatarImage src={selectedUser?.image} alt='user_image' className='w-10 h-10 object-cover rounded-full' />
        </Avatar>
        <span className={'font-medium text-lg '}>
          {selectedUser?.name}
        </span>
      </div>
      <div className='flex gap-2 items-center'>
        <X onClick={() => {
          setSelectedUser(null)
          playSound()
        }} className='text-muted-foreground cursor-pointer hover:text-primary' />
      </div>
    </div>
  )
}

export default ChatTopBar
