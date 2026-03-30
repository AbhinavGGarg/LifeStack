import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { findUserById } from "@/lib/userStore";

export default async function Home() {
  const token = (await cookies()).get(authCookieName)?.value;
  const payload = await verifyAuthToken(token);

  if (!payload?.sub) {
    redirect("/login");
  }

  const user = await findUserById(payload.sub);

  if (!user) {
    redirect("/login");
  }

  if (user?.profile?.onboardingComplete === false) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
