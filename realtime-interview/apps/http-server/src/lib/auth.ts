import {prisma} from '@repo/db';
export const SignupHelper = async (username: string, password: string) => {
  try {
    const user = await prisma.user.create({
      data: { username: username, password: password },
    });
    return user;
  } catch (err) {
    throw err;
  }
};

export const Login = async (username: string) => {
  try {
    const user = await prisma.user.findFirst({ where: { username: username } });
    return user;
  } catch (err) {
    throw err;
  }
};
