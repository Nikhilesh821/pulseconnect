import { useSelectedUser } from '@/store/useSelectedUser'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { X, Phone, PhoneOff, Mic, MicOff } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import useSound from 'use-sound'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { socket } from '@/lib/socket'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const ChatTopBar = () => {
  const { selectedUser, setSelectedUser } = useSelectedUser()
  const { user: currentUser } = useKindeBrowserClient()
  const [playSound] = useSound('/sounds/mouse-click.mp3')

  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'active'>('idle')
  const [isMuted, setIsMuted] = useState(false)

  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const pendingOffer = useRef<any>(null)

  const handleLocalEndCall = () => {
    console.log("Cleaning up local call state");
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop())
      localStream.current = null
    }
    setCallState('idle')
    pendingOffer.current = null
  }

  const endCall = () => {
    // Notify the other peer
    const targetId = selectedUser?.id || pendingOffer.current?.from;
    console.log("Initiating end call for:", targetId);
    if (targetId) {
      socket.emit('signal', {
        to: targetId,
        from: currentUser?.id,
        type: 'end-call'
      })
    }
    handleLocalEndCall();
  }

  useEffect(() => {
    if (!currentUser?.id) return

    // Connect and join self room for signaling
    socket.connect()
    socket.emit('join-self', currentUser.id)

    const handleSignal = async ({ from, signal, type }: any) => {
      console.log(`Received ${type} signal from ${from}`)
      if (type === 'offer') {
        // Only receive calls from the person we are currently chatting with
        // Actually, in a real app you'd want to allow calls from anyone, 
        // but for this simple implementation let's just log it.
        setCallState('incoming')
        // Store the signaling data to act on it when user accepts
        pendingOffer.current = { from, signal }
      } else if (type === 'answer' && peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal))
      } else if (type === 'ice-candidate' && peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal))
        } catch (e) {
          console.error('Error adding ice candidate', e)
        }
      } else if (type === 'end-call') {
        console.log("Call ended by remote peer");
        handleLocalEndCall();
      }
    }

    socket.on('signal', handleSignal)
    return () => {
      socket.off('signal', handleSignal)
    }
  }, [currentUser?.id])



  const setupPeerConnection = async () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && selectedUser?.id) {
        socket.emit('signal', {
          to: selectedUser.id,
          from: currentUser?.id,
          type: 'ice-candidate',
          signal: event.candidate
        })
      }
    }

    peerConnection.current.ontrack = (event) => {
      console.log('Received remote track')
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0]
      }
    }

    localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    localStream.current.getTracks().forEach(track => {
      peerConnection.current?.addTrack(track, localStream.current!)
    })
  }

  const initiateCall = async () => {
    if (!selectedUser?.id) return
    setCallState('calling')
    await setupPeerConnection()

    const offer = await peerConnection.current!.createOffer()
    await peerConnection.current!.setLocalDescription(offer)

    socket.emit('signal', {
      to: selectedUser.id,
      from: currentUser?.id,
      type: 'offer',
      signal: offer
    })
  }

  const acceptCall = async () => {
    if (!pendingOffer.current) return
    setCallState('active')
    await setupPeerConnection()

    await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(pendingOffer.current.signal))
    const answer = await peerConnection.current!.createAnswer()
    await peerConnection.current!.setLocalDescription(answer)

    socket.emit('signal', {
      to: pendingOffer.current.from,
      from: currentUser?.id,
      type: 'answer',
      signal: answer
    })
    pendingOffer.current = null
  }





  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  return (
    <div className='w-full h-20 flex p-4 justify-between items-center border-b'>
      <audio ref={remoteAudioRef} autoPlay />

      <div className='flex items-center gap-2'>
        <Avatar className='flex justify-center items-center h-10 w-10 shrink-0'>
          <AvatarImage src={selectedUser?.image} alt='user_image' className='w-10 h-10 object-cover rounded-full' />
        </Avatar>
        <span className={'font-medium text-lg'}>
          {selectedUser?.name}
        </span>
      </div>

      <div className='flex gap-4 items-center'>
        <Phone
          onClick={initiateCall}
          className='text-muted-foreground cursor-pointer hover:text-green-500 transition-colors'
          size={20}
        />
        <X onClick={() => {
          setSelectedUser(null)
          playSound()
        }} className='text-muted-foreground cursor-pointer hover:text-primary' />
      </div>

      {/* Incoming Call Dialog */}
      <Dialog open={callState === 'incoming'}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Incoming Voice Call</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={selectedUser?.image} className="rounded-full" />
            </Avatar>
            <p className="text-lg font-semibold">{selectedUser?.name} is calling you...</p>
          </div>
          <DialogFooter className="sm:justify-center gap-4">
            <Button variant="outline" onClick={endCall} className="bg-red-500 hover:bg-red-600 text-white border-none">
              <PhoneOff className="mr-2 h-4 w-4" /> Decline
            </Button>
            <Button onClick={acceptCall} className="bg-green-500 hover:bg-green-600 text-white border-none">
              <Phone className="mr-2 h-4 w-4" /> Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Call / Calling Overlay */}
      <Dialog open={callState === 'calling' || callState === 'active'}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{callState === 'calling' ? 'Calling...' : 'In Call'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 gap-4">
            <Avatar className={`h-24 w-24 ${callState === 'calling' ? 'animate-pulse' : ''}`}>
              <AvatarImage src={selectedUser?.image} className="rounded-full" />
            </Avatar>
            <p className="text-xl font-semibold">{selectedUser?.name}</p>
            {callState === 'active' && <p className="text-green-500 animate-pulse">Connected</p>}
          </div>
          <DialogFooter className="sm:justify-center gap-4">
            <Button variant="ghost" onClick={toggleMute} className="rounded-full h-12 w-12 p-0">
              {isMuted ? <MicOff className="h-6 w-6 text-red-500" /> : <Mic className="h-6 w-6" />}
            </Button>
            <Button onClick={endCall} className="rounded-full h-12 w-12 p-0 bg-red-500 hover:bg-red-600 text-white border-none">
              <PhoneOff className="h-6 w-6" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChatTopBar
