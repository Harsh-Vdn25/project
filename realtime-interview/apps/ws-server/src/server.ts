import { WebSocketServer } from "ws";
import { decodeToken } from "./lib/decodeToken";
import { Meetmanager } from "./Meetmanager";
import { messageTypes } from "./utils/enums";

async function main() {
  const wss = new WebSocketServer({ port: 8080 });
  const meetManage = new Meetmanager();
  wss.on("connection", (socket, request) => {
    const url = request.url;
    const queryParams = new URLSearchParams(url?.split("?")[1]);
    const token = queryParams.get("token");
    if (!token) return socket.send(JSON.stringify({ message: "No token." }));

    const decoded = decodeToken(token);
    if (!decoded.success)
      return socket.send(JSON.stringify({ message: "Outdated token." }));

    socket.on('message',(data)=>{
      const dataStr = data.toString();
      const message  = JSON.parse(dataStr);
      if(message.type === messageTypes.CREATE_ROOM){}
    })
  });
}
main();
