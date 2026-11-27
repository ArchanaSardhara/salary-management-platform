import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_TOKEN_COOKIE, AUTH_ROUTES } from "@/features/auth/routes";

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    redirect(AUTH_ROUTES.afterLogin);
  } else {
    redirect(AUTH_ROUTES.login);
  }
}
