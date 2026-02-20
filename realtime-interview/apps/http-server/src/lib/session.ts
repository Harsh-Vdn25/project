import { createToken } from "./jwt";

export const createSessionKeys = async (userId: string, role: string):Promise<{
  access: string,
  refresh: string
}> => {
  const accessToken = await createToken(userId, role, true);
  const refreshToken = await createToken(userId, role, false);
  if (!refreshToken || !accessToken) {
    throw new Error("Invalid user Id")
  }
  return { access: accessToken, refresh: refreshToken };
};
