import { Login } from "@/app/lib/auth/auth";
import bcrypt from "bcrypt";
import { createSessionKeys } from "@/app/lib/auth/session";

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
