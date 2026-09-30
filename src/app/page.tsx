export const dynamic = "force-dynamic";

import ChatLayout from "@/components/Chat/ChatLayout";

import PreferencesTab from "@/components/PreferencesTab";
import { redis } from "@/lib/db";
import { cookies } from "next/headers";
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'
import { User } from "@/types/user";

async function getUsers(): Promise<User[]> {
  const userKeys: string[] = []
  let cursor = "0"
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: "user:*", type: "hash", count: 100 })
    cursor = nextCursor
    userKeys.push(...keys)

  } while (cursor !== "0")

  const { getUser } = getKindeServerSession()
  let currentUser = await getUser()
  const cookieStore = await cookies()
  if (!currentUser && cookieStore.get("demo_user")?.value === "true") {
    currentUser = { id: "demo-user-1", given_name: "Nikhilesh", email: "nikhil@pulseconnect.dev" } as any;
  }


  const pipeline = redis.pipeline()
  let users: User[] = []
  if (pipeline && userKeys.length > 0) {
    userKeys.forEach(key => pipeline.hgetall(key))
    const result = (await pipeline.exec()) as User[]
    for (const user of result) {
      if (user.id !== currentUser?.id)
        users.push(user)
    }
  }

  if (users.length === 0) {
    users = [
      {
        id: "demo-sarah",
        name: "Sarah Jenkins (Lead Engineer)",
        email: "sarah@techcorp.io",
        image: "https://avatar.iran.liara.run/public/girl?username=Sarah"
      },
      {
        id: "demo-alex",
        name: "Alex Rivera (Product Designer)",
        email: "alex@designcraft.co",
        image: "https://avatar.iran.liara.run/public/boy?username=Alex"
      },
      {
        id: "demo-maya",
        name: "Maya Patel (Engineering Manager)",
        email: "maya@cloudscale.net",
        image: "https://avatar.iran.liara.run/public/girl?username=Maya"
      }
    ]
  }

  return users
}
export default async function Home() {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get("demo_user")?.value === "true"
  let isKindeAuth = false

  try {
    const { isAuthenticated } = getKindeServerSession()
    isKindeAuth = Boolean(await isAuthenticated())

  } catch (e) {
    isKindeAuth = false
  }

  if (!isDemo && !isKindeAuth) {
    return redirect('/auth')
  }
  const users = await getUsers()
  const defaultLayout = undefined

  return (
    <main className="flex h-screen min-h-screen min-w-screen flex-col justify-center items-center p-4 md:px-24 py-32 gap-4">
      <div
        className='absolute top-0 z-[-2] h-screen w-screen dark:bg-[#000000] dark:bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] 
				dark:bg-size-[20px_20px] bg-[#ffffff] bg-[radial-gradient(#00000033_1px,#ffffff_1px)] bg-size-[20px_20px]'
        aria-hidden='true'
      />
      <div className="z-10 rounded-lg max-w-5xl w-full min-h-screen text-sm lg:flex min-w-screen">
        <ChatLayout users={users} defaultLayout={defaultLayout} />
      </div>
    </main>
  );
}
