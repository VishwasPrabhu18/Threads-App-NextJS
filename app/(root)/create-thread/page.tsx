import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const Page = async () => {

  const { user } = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user?.id);
  return (
    <div>Page</div>
  )
}

export default Page;