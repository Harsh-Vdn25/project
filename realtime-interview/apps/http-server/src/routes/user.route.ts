import express, { Router } from 'express';
import { Signin, Signup } from '../controllers/user.controller';
export const userRoute:Router = express.Router();

userRoute.post('/signup',Signup);
userRoute.post('/signin',Signin);