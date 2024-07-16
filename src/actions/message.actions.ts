"use server"

import { redis } from "@/lib/db"
import { Message } from "@/types/message"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { pusherServer } from "@/lib/pusher"

interface SendMessageArgs {
    content: string,
    messageType: "text" | "image" |"video",
    receiverId: string
}
export async function sendMessageAction({ content, messageType, receiverId }: SendMessageArgs) {
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    if (!user) {
        return {
            success: false,
            message: "User not authenticated"
        }
    }
    console.log(content)
    console.log(messageType)

    const senderId = user.id
    const conversationId = `conversation:${[senderId, receiverId].sort().join(":")}`
    const conversationExist = await redis.exists(conversationId)
    if (!conversationExist) {
        await redis.hset(conversationId, {
            participant1: senderId,
            participant2: receiverId
        })
    }

    await redis.sadd(`user:${senderId}:conversations`, conversationId)
    await redis.sadd(`user:${receiverId}:conversations`, conversationId)

    const messageId = `message:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`
    const timeStamp = Date.now()

    //creating the message hash
    await redis.hset(messageId, {
        senderId,
        timeStamp,
        content,
        messageType,
    })

    //add the message into a conversation
    await redis.zadd(`${conversationId}:messages`, { score: timeStamp, member: JSON.stringify(messageId) }) //sorting based on timestamp
    const channelName = `${senderId}__${receiverId}`.split('__').sort().join('__')
    await pusherServer?.trigger(channelName, "newMessage", {
        message: { senderId, content, timeStamp, messageType }
    })
    return { success: true, conversationId, messageId }
}

export async function getMessageAction(selectedUserId: string, currentUserId: String) {
    const conversationId = `conversation:${[selectedUserId, currentUserId].sort().join(":")}`
    const messageIds = await redis.zrange(`${conversationId}:messages`, 0, -1)
    if (messageIds.length === 0) return []
    const pipeline = redis.pipeline()
    messageIds.forEach((messageId) => pipeline.hgetall(messageId as string))
    const messages = await pipeline.exec() as Message[]
    return messages
    

}