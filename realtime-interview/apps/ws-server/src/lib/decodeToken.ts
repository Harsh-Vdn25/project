import jwt, { JwtPayload } from "jsonwebtoken";

export const decodeToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, "secret") as JwtPayload | undefined;
    if (!decoded) return { success: false };
    return {
      success: true,
      id: decoded.id,
      role: decoded.role,
    };
  } catch (err) {
    return { success: false };
  }
};
