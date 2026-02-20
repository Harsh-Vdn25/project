import express from "express";
import cors from "cors";
import { userRoute } from "./routes/user.route";

const app = express();
const corsOptions = {
  origin: "http:localhost:3000/",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/user/",userRoute);

app.listen("5000", () => {
  console.log("App is running on port 5000");
});
