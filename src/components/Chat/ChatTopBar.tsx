import { useSelectedUser } from '@/store/useSelectedUser'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { X, Phone, PhoneOff, Mic, MicOff, Video, VideoOff, RefreshCw } from 'lucide-react'
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
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isRemotePrimary, setIsRemotePrimary] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null)
  const remoteStreamState = useRef<MediaStream | null>(null) // Internal ref to keep track of remote stream
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const pendingOffer = useRef<any>(null)
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([])

  const handleLocalEndCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop())
      localStream.current = null
    }
    setCallState('idle')
    setIsVideoCall(false)
    setIsMuted(false)
    setIsCameraOff(false)
    setIsRemotePrimary(true)
    pendingOffer.current = null
    setRemoteStream(null)
    setLocalStreamState(null)
    remoteStreamState.current = null
    iceCandidateQueue.current = []
    setFacingMode('user')
  }

  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setHasMultipleCameras(videoDevices.length > 1)
      } catch (err) {
        console.error('Error checking cameras:', err)
      }
    }
    checkCameras()
  }, [])

  const endCall = () => {
    // Notify the other peer
    const targetId = selectedUser?.id || pendingOffer.current?.from;
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
      if (type === 'offer') {
        // Only receive calls from the person we are currently chatting with
        // In a real app you'd want to allow calls from anyone but for implemetation simplicity we are only allowing calls from the person we are currently chatting with

        setCallState('incoming')
        setIsVideoCall(signal.isVideo)
        // Store the signaling data to act on it when user accepts
        // For example - User A has generated a "Session Description" (SDP) and sent it to User B which will be used to create a connection between User A and User B when user B accepts the call
        pendingOffer.current = { from, signal: signal.sdp }
      } else if (type === 'answer' && peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal))
        setCallState('active')
        // Process any queued candidates
        while (iceCandidateQueue.current.length > 0) {
          const candidate = iceCandidateQueue.current.shift()
          if (candidate) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
          }
        }
      } else if (type === 'ice-candidate') {
        if (peerConnection.current && peerConnection.current.remoteDescription) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal))
          } catch (e) {
            console.error('Error adding ice candidate', e)
          }
        } else {
          iceCandidateQueue.current.push(signal)
        }
      } else if (type === 'end-call') {
        handleLocalEndCall();
      }
    }

    socket.on('signal', handleSignal)
    return () => {
      socket.off('signal', handleSignal)
    }
  }, [currentUser?.id])

  const setupPeerConnection = async (isVideo: boolean) => {
    // If there's an existing stream, stop it first to release the hardware
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }

    // Initializes the RTCPeerConnection object which manages the entire P2P lifecycle.
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    // as soon as the connection is created the browser starts looking for 'candidates' which are the best possible paths to send audio data.

    // an ice canidate is just a potential network address where the remote peer can send data to us.

    // A single browser usually generates several candidates
    // Local Candidate: Your internal IP (e.g., 192.168.1.5). Good if you are both on the same WiFi.
    // Server Reflexive Candidate: Your Public IP (found via the STUN server). Needed to get through your home router.
    // Relay Candidate: A TURN server IP (a backup if direct connection is blocked by a firewall).

    // User A finds a potential "path" (Candidate #1).
    // User A can't send it directly to User B yet because the "P2P pipe" isn't open.
    // So, User A sends it to the Signaling Server (Socket.io).
    // The Signaling Server "Forwards" it to User B.
    // User B tries that path. If it works, the P2P pipe opens!
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

    // This is the remote audio/video stream that fires when the remote track is added(starts arriving from the other person) to the connection.
    peerConnection.current.ontrack = (event) => {
      remoteStreamState.current = event.streams[0]
      setRemoteStream(event.streams[0])
    }

    try {
      // get the usermedia and starts recording their audio/video
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      })
      localStream.current = stream
      setLocalStreamState(stream)
    } catch (error: any) {
      console.error('Error accessing media devices:', error)
      if (error.name === 'NotReadableError') {
        alert('Could not start video source. Your camera might be in use by another application or tab.')
      } else {
        alert('Could not access camera/microphone: ' + error.message)
      }
      handleLocalEndCall()
      throw error // Re-throw to stop the call initiation
    }

    // addTrack takes the local tracks and adds them to the connection.
    localStream.current!.getTracks().forEach(track => {
      peerConnection.current?.addTrack(track, localStream.current!)
    })
  }

  const initiateCall = async (video: boolean = false) => {
    if (!selectedUser?.id || callState !== 'idle') return
    setIsVideoCall(video)
    setCallState('calling')

    try {
      await setupPeerConnection(video)
    } catch (e) {
      return
    }

    const offer = await peerConnection.current!.createOffer()
    await peerConnection.current!.setLocalDescription(offer)

    socket.emit('signal', {
      to: selectedUser.id,
      from: currentUser?.id,
      type: 'offer',
      signal: {
        sdp: offer,
        isVideo: video
      }
    })
  }

  const acceptCall = async () => {
    if (!pendingOffer.current || callState === 'active') return
    setCallState('active')

    try {
      await setupPeerConnection(isVideoCall)
    } catch (e) {
      // Error is handled inside setupPeerConnection
      return
    }

    await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(pendingOffer.current.signal))
    // Process any queued candidates
    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift()
      if (candidate) {
        await peerConnection.current!.addIceCandidate(new RTCIceCandidate(candidate))
      }
    }
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

  const toggleCamera = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsCameraOff(!isCameraOff)
    }
  }

  const switchCamera = async () => {
    if (!localStream.current || !isVideoCall) return

    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      })

      const newVideoTrack = newStream.getVideoTracks()[0]
      const oldVideoTracks = localStream.current.getVideoTracks()

      if (peerConnection.current) {
        const senders = peerConnection.current.getSenders()
        const videoSender = senders.find(s => s.track?.kind === 'video')
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack)
        }
      }

      // Stop old tracks
      oldVideoTracks.forEach(track => track.stop())

      // Combine existing audio with new video track
      const audioTrack = localStream.current.getAudioTracks()[0]
      const tracks = []
      if (audioTrack) tracks.push(audioTrack)
      tracks.push(newVideoTrack)

      const combinedStream = new MediaStream(tracks)
      localStream.current = combinedStream
      setLocalStreamState(combinedStream)
      setFacingMode(newFacingMode)
    } catch (error) {
      console.error("Error switching camera:", error)
      alert("Could not switch camera. Keep in mind that some browsers require a page refresh to release the camera hardware.")
    }
  }

  return (
    <div className='w-full h-20 flex p-4 justify-between items-center border-b'>
      {/* Hidden video element to keep the remote stream active even when dialog is closed */}
      <video
        ref={(el) => {
          if (el && remoteStream) el.srcObject = remoteStream
        }}
        autoPlay
        playsInline
        className="hidden"
      />

      <div className='flex items-center gap-2'>
        <Avatar className='flex justify-center items-center h-10 w-10 shrink-0'>
          <AvatarImage src={selectedUser?.image} alt='user_image' className='w-10 h-10 object-cover rounded-full' />
        </Avatar>
        <span className={'font-medium text-lg'}>
          {selectedUser?.name}
        </span>
      </div>

      <div className='flex gap-4 items-center'>
        <Video
          onClick={() => initiateCall(true)}
          className='text-muted-foreground cursor-pointer hover:text-green-500 transition-colors'
          size={20}
        />
        <Phone
          onClick={() => initiateCall(false)}
          className='text-muted-foreground cursor-pointer hover:text-green-500 transition-colors'
          size={20}
        />
        <X onClick={() => {
          setSelectedUser(null)
          playSound()
        }} className='text-muted-foreground cursor-pointer hover:text-primary' />
      </div>

      <Dialog open={callState === 'incoming'}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Incoming {isVideoCall ? 'Video' : 'Voice'} Call</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={selectedUser?.image} className="rounded-full" />
            </Avatar>
            <p className="text-lg font-semibold">{selectedUser?.name} is calling you...</p>
          </div>
          <DialogFooter className="flex-row justify-center gap-4">
            <Button variant="outline" onClick={endCall} className="bg-red-500 hover:bg-red-600 text-white border-none">
              <PhoneOff className="mr-2 h-4 w-4" /> Decline
            </Button>
            <Button onClick={acceptCall} className="bg-green-500 hover:bg-green-600 text-white border-none">
              <Phone className="mr-2 h-4 w-4" /> Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={callState === 'calling' || callState === 'active'}>
        <DialogContent className={`${isVideoCall ? 'w-screen h-dvh sm:w-[95vw] sm:h-[95vh] max-w-none' : 'sm:max-w-md'} p-0 overflow-hidden flex flex-col`}>
          <DialogHeader className={isVideoCall ? "p-4 border-b shrink-0" : ""}>
            <DialogTitle>{callState === 'calling' ? 'Calling...' : 'In Call'}</DialogTitle>
          </DialogHeader>

          <div className={`flex flex-col items-center justify-center gap-4 w-full ${isVideoCall ? 'flex-1' : 'h-full'} p-4`}>
            {isVideoCall && callState === 'active' ? (
              <div className="relative w-full h-full sm:aspect-video bg-black rounded-lg overflow-hidden group">
                {/* Primary Video */}
                <video
                  ref={(el) => {
                    if (el) el.srcObject = isRemotePrimary ? remoteStream : localStreamState
                  }}
                  autoPlay
                  playsInline
                  muted={!isRemotePrimary}
                  className={`w-full h-full object-cover transition-all duration-300 ${(!isRemotePrimary && facingMode === 'user') ? '-scale-x-100' : ''}`}
                />

                {/* Secondary (PIP) Video */}
                <div
                  onClick={() => setIsRemotePrimary(!isRemotePrimary)}
                  className="absolute bottom-4 left-4 w-32 md:w-48 aspect-video bg-muted rounded-md border-2 border-white shadow-xl cursor-pointer overflow-hidden transition-all hover:scale-105 z-10"
                >
                  <video
                    ref={(el) => {
                      if (el) el.srcObject = isRemotePrimary ? localStreamState : remoteStream
                    }}
                    autoPlay
                    playsInline
                    muted={isRemotePrimary}
                    className={`w-full h-full object-cover ${(isRemotePrimary && facingMode === 'user') ? '-scale-x-100' : ''}`}
                  />
                  <div className="absolute bottom-1 left-1 bg-black/40 px-1 rounded text-[10px] text-white">
                    {isRemotePrimary ? 'You' : (selectedUser?.name?.split(' ')[0] || selectedUser?.name)}
                  </div>
                </div>

                <div className="absolute top-4 left-4 bg-black/50 px-2 py-1 rounded text-xs text-white">
                  {isRemotePrimary ? (selectedUser?.name?.split(' ')[0] || selectedUser?.name) : 'You'}
                </div>
              </div>
            ) : isVideoCall && callState === 'calling' ? (
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={(el) => {
                    if (el && localStreamState) el.srcObject = localStreamState
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover opacity-50 ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Avatar className="h-20 w-20 mb-4 animate-pulse">
                    <AvatarImage src={selectedUser?.image} className="rounded-full" />
                  </Avatar>
                  <p className="text-xl font-semibold">Calling {selectedUser?.name}...</p>
                </div>
              </div>
            ) : (
              <>
                <Avatar className={`h-24 w-24 ${callState === 'calling' ? 'animate-pulse' : ''}`}>
                  <AvatarImage src={selectedUser?.image} className="rounded-full" />
                </Avatar>
                <p className="text-xl font-semibold">{selectedUser?.name}</p>
                {callState === 'active' && <p className="text-green-500 animate-pulse">Connected</p>}
              </>
            )}
          </div>

          <DialogFooter className={cn(
            "flex-row justify-center gap-4",
            isVideoCall && callState === 'active'
              ? "absolute bottom-8 right-8 bg-black/60 backdrop-blur-lg p-4 rounded-3xl border border-white/20 shadow-2xl z-20 flex-wrap"
              : isVideoCall
                ? "p-4 border-t shrink-0 relative z-20"
                : "p-4 border-t"
          )}>
            <Button variant="ghost" onClick={toggleMute} className="rounded-full h-12 w-12 p-0 hover:bg-white/20 text-white">
              {isMuted ? <MicOff className="h-6 w-6 text-red-500" /> : <Mic className="h-6 w-6" />}
            </Button>
            {isVideoCall && (
              <Button variant="ghost" onClick={toggleCamera} className="rounded-full h-12 w-12 p-0 hover:bg-white/20 text-white">
                {isCameraOff ? <VideoOff className="h-6 w-6 text-red-500" /> : <Video className="h-6 w-6" />}
              </Button>
            )}
            {isVideoCall && hasMultipleCameras && (
              <Button variant="ghost" onClick={switchCamera} className="rounded-full h-12 w-12 p-0 hover:bg-white/20 text-white">
                <RefreshCw className="h-6 w-6" />
              </Button>
            )}
            <Button onClick={endCall} className="rounded-full h-12 w-12 p-0 bg-red-500 hover:bg-red-600 text-white border-none shadow-lg">
              <PhoneOff className="h-6 w-6" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChatTopBar
