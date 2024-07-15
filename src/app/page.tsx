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
  const currentUser = await getUser()

  const pipeline = redis.pipeline()
  userKeys.forEach(key => pipeline.hgetall(key))
  const result = (await pipeline.exec()) as User[]

  const users: User[] = []

  for (const user of result) {
    if (user.id !== currentUser?.id)
      users.push(user)
  }
  return users
}
export default async function Home() {
  const { isAuthenticated } = getKindeServerSession()
  if (!(await isAuthenticated())) {
    return redirect('/auth')
  }
  const users=await getUsers()
  const layout = cookies().get("resizable-panel-layout")
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined
  return (
    <main className="flex h-screen flex-col justify-center items-center p-4 md:px-24 py-32 gap-4">
      <PreferencesTab />


      <div
        className='absolute top-0 z-[-2] h-screen w-screen dark:bg-[#000000] dark:bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] 
				dark:bg-[size:20px_20px] bg-[#ffffff] bg-[radial-gradient(#00000033_1px,#ffffff_1px)] bg-[size:20px_20px]'
        aria-hidden='true'
      />
      <div className="z-10 border rounded-lg max-w-5xl w-full min-h-[85vh] text-sm lg:flex ">
        <ChatLayout users={users} defaultLayout={defaultLayout} />
      </div>
    </main>
  );
}
