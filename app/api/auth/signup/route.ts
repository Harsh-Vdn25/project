import { Signup } from "@/app/lib/auth/auth";
import { createToken } from "@/app/lib/auth/jwt";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
export async function POST(req: Request) {
  const body = await req.json();
  try {
    const { username, password } = body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await Signup(username, hashedPassword);
    if (!user?.id) {
      return Response.json({ message: "user doesn't exist." }, { status: 404 });
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
    return Response.json(
      { message: "you are successfully signed up." },
      { status: 200 },
    );
  } catch (err) {
    console.log(err);
    return Response.json({ message: "serverside problem." }, { status: 500 });
  }
}
