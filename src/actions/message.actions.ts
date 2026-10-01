"use server"

import { redis } from "@/lib/db"
import { Message } from "@/types/message"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
// pusherServer removed in favor of Node server

interface SendMessageArgs {
    content: string,
    messageType: "text" | "image" | "video",
    receiverId: string
}
export async function sendMessageAction({ content, messageType, receiverId }: SendMessageArgs) {
    const { getUser } = getKindeServerSession()
    let user = await getUser()
    if (!user) {
        const { cookies } = await import("next/headers")
        const cookieStore = await cookies()
        const isDemo = cookieStore.get("demo_user")?.value === "true"
        if (isDemo) {
            user = { id: "demo-user-1", given_name: "Nikhilesh" } as any
        } else {
            return {
                success: false,
                message: "User not authenticated"
            }
        }
    }


    const senderId = user!.id
    const conversationId = `conversation:${[senderId, receiverId].sort().join(":")}`

    const messageId = `message:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`
    const timeStamp = Date.now()

    const pipeline = redis.pipeline()

    // Create conversation if it doesn't exist (using hsetnx or just hset is fine here since it's small)
    pipeline.hset(conversationId, {
        participant1: senderId,
        participant2: receiverId
    })

    pipeline.sadd(`user:${senderId}:conversations`, conversationId)
    pipeline.sadd(`user:${receiverId}:conversations`, conversationId)

    // Creating the message hash
    pipeline.hset(messageId, {
        senderId,
        timeStamp,
        content,
        messageType,
    })

    // Add the message into a conversation
    pipeline.zadd(`${conversationId}:messages`, { score: timeStamp, member: messageId })

    // Execute all redis commands in one roundtrip
    await pipeline.exec()

    const channelName = `${senderId}__${receiverId}`.split('__').sort().join('__')

    // Broadcast via Node.js WebSocket server
    const broadcastUrl = `${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL}/broadcast`;

    await fetch(broadcastUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            room: channelName,
            event: "newMessage",
            data: { message: { senderId, content, timeStamp, messageType } }
        })
    }).catch(err => console.error("Broadcast fetch error:", err));

    return { success: true, conversationId, messageId }
}

// fetches the conversation from redis
export async function getMessageAction(selectedUserId: string, currentUserId: string) {
    const conversationId = `conversation:${[selectedUserId, currentUserId || "demo-user-1"].sort().join(":")}`

    const messageIds = await redis.zrange(`${conversationId}:messages`, 0, -1)
    if (messageIds.length === 0) return []
    const pipeline = redis.pipeline()
    messageIds.forEach((messageId) => pipeline.hgetall(messageId as string))
    const messages = await pipeline.exec() as Message[]
    return messages
}