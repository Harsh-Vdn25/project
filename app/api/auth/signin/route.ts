import { Login } from "@/app/lib/auth/auth";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { createToken } from "@/app/lib/auth/jwt";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const { username, password } = body;
    const user = await Login(username);
    if (!user?.id) {
      return Response.json({ message: "user doesn't exist." }, { status: 404 });
    }
    const isValid = await bcrypt.compare(password, user?.password);

    if (!isValid) {
      return Response.json({ message: "please check your password." });
    }
    const accessToken = await createToken(user.id, true);
    const refreshToken = await createToken(user.id, false);

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
    Response.json({
      message: "Successfully logged in.",
      accessToken: accessToken,
    });
  } catch (err) {
    console.log(err);
    return Response.json({ message: "serverside problem." }, { status: 500 });
  }
}
