"use server"

import { redis } from "@/lib/db"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

export async function checkAuthStatus() {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user) {
        return { success: false }
    }
    const userId = `user:${user.id}`
    const existingUser = await redis.hgetall(userId)
    //sign up case 
    if (!existingUser || Object.keys(existingUser).length === 0) {
        const imgIsNull = user.picture?.includes("gravatar")
        const image = imgIsNull ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.given_name || 'User')}&background=6366f1&color=fff&size=128` : user.picture
        await redis.hset(userId, {
            id: user.id,
            name: `${user.given_name} ${user.family_name ?? ""}`.trim(),
            email: user.email,
            image: image
        })
    }

    return { success: true }
}