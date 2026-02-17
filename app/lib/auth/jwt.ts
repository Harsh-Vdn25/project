import jwt from "jsonwebtoken";

export async function createToken(
  id: number,
  role: string,
  isAccessToken: boolean,
) {
  if (!id) {
    return null;
  }
  const token = jwt.sign(
    {
      id: id,
      role: role,
    },
    "secret",
    { expiresIn: isAccessToken ? "15m" : "10d" },
  );
  return token;
}
