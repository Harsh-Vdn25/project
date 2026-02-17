import { Signup } from "@/app/lib/auth/auth";
import { createSessionKeys } from "@/app/lib/auth/session";
import bcrypt from "bcrypt";
export async function POST(req: Request) {
  const body = await req.json();
  try {
    const { username, password } = body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await Signup(username, hashedPassword);
    if (!user?.id) {
      return Response.json({ message: "user doesn't exist." }, { status: 404 });
    }
    const accessToken = await createSessionKeys(user.id,user.role);
    return Response.json({
      message: "Successfully logged in.",
      accessToken: accessToken,
    });
  } catch (err) {
    console.log(err);
    return Response.json({ message: "serverside problem." }, { status: 500 });
  }
}
