import jwt from "jsonwebtoken";

export async function createToken(id: number, isAccessToken: boolean) {
  if (!id) {
    return null;
  }
  const token = jwt.sign(
    {
      id: id,
    },
    "secret",
    { expiresIn: isAccessToken ? "15m" : "10d" },
  );
  return token;
}
