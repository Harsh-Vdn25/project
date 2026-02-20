import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { createSessionKeys } from "../lib/session";
import { Login, SignupHelper } from "../lib/auth";

export const Signin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await Login(username);
    if (!user || !user.id) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const tokens = await createSessionKeys(user.id, user.role);

    res.cookie("refreshToken", tokens.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      message: "Successfully logged in.",
      accessToken: tokens.access,
    });
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};


export const Signup = async(req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await SignupHelper(username, hashedPassword);
    if (!user?.id) {
      return res.status(404).json({ message: "user doesn't exist." });
    }
    const tokens = await createSessionKeys(user.id,user.role);

    res.cookie("refreshToken", tokens.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      message: "Successfully logged in.",
      accessToken: tokens.access,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "serverside problem." });
  }
};
