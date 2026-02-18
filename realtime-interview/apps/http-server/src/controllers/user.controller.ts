// import { Request, Response } from "express";
// import { createSessionKeys } from "../lib/session";
// import { Login, SignupHelper } from "../lib/auth";
// import bcrypt from 'bcrypt';

// export const Signin = async (req: Request, res: Response) => {
//   const { username, password } = req.body;
//   try {
//     const user = await Login(username);
//     if (!user?.id) {
//       return res.status(404).json({ message: "user doesn't exist." });
//     }
//     const isValid = await bcrypt.compare(password, user?.password);

//     if (!isValid) {
//       return res.status(404).json({ message: "please check your password." });
//     }
//     const accessToken = await createSessionKeys(user.id, user.role);
//     return res.status(200).json({
//       message: "Successfully logged in.",
//       accessToken: accessToken,
//     });
//   } catch (err) {
//     console.log(err);
//     return res.json({ message: "serverside problem." });
//   }
// };

// export const Signup = async(req: Request, res: Response) => {
//     const { username, password } = req.body;
//     try {
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await SignupHelper(username, hashedPassword);
//     if (!user?.id) {
//       return res.status(404).json({ message: "user doesn't exist." });
//     }
//     const accessToken = await createSessionKeys(user.id,user.role);
//     return res.status(200).json({
//       message: "Successfully logged in.",
//       accessToken: accessToken,
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ message: "serverside problem." });
//   }
// };
