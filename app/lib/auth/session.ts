import { cookies } from "next/headers";
import { createToken } from "./jwt";

export const createSessionKeys = async (userId: number, role: string) => {
  const accessToken = await createToken(userId, role, true);
  const refreshToken = await createToken(userId, role, false);
  if (!refreshToken) {
    return Response.json(
      { message: "No refresh token generated" },
      { status: 500 },
    );
  }
  const cookieStore = await cookies();
  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
  return accessToken;
};
