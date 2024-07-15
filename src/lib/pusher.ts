import PusherServer from "pusher"
import PusherClient from "pusher-js"

declare global {
    var pusherServer: PusherServer | undefined
    var pusherClient: PusherClient | undefined
}
export const pusherServer = global.pusherServer || new PusherServer({
    appId: process.env.PUSHER_APP_ID as string,
    key: process.env.PUSHER_APP_KEY as string,
    secret: process.env.PUSHER_APP_SECRET as string,
    cluster: process.env.PUSHER_APP_CLUSTER as string,
    useTLS: true
})

export const pusherClient=global.pusherClient|| new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY as string,{
    cluster:"ap2"
})