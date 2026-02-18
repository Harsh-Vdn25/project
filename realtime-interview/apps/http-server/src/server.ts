import express from "express";
import cors from "cors";
import {prisma} from '@repo/db';
const app = express();
const corsOptions = {
  origin: "http:localhost:3000/",
};
app.use(cors(corsOptions));
app.use(express.json());

async function main(){
    await prisma.user.create({
        data:{
            username: "harsha",
            password: "123"
        }
    })
}
app.listen("5000", () => {
  console.log("App is running on port 5000");
  main();
});
