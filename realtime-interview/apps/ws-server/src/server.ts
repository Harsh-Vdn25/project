import { WebSocketServer } from "ws";
import { decodeToken } from "./lib/decodeToken";
import { Meetmanager } from "./Meetmanager";
import { messageTypes } from "./utils/enums";

async function main() {
  const wss = new WebSocketServer({ port: 8080 });
  const meetManager = new Meetmanager();
  wss.on("connection", (socket, request) => {
    const url = request.url;
    const queryParams = new URLSearchParams(url?.split("?")[1]);
    const token = queryParams.get("token");
    if (!token) return socket.send(JSON.stringify({ message: "No token." }));

    const decoded = decodeToken(token);
    if (!decoded.success)
      return socket.send(JSON.stringify({ message: "Outdated token." }));

    if (decoded.role === "ADMIN" || decoded.role === "USER") {
      (socket as any).user = { id: decoded.id, role: decoded.role };
      socket.send(JSON.stringify({ message: "Connection successful." }));
    }

    socket.on("message", (data) => {
      const strData = data.toString();
      const message = JSON.parse(strData);
      const user = (socket as any).user;

      switch (message.type) {
        case messageTypes.CREATE_ROOM:
          meetManager.createRoom(user, message.language, socket); //validate the input later
          break;
        
          case messageTypes.JOIN_ROOM:
          if (!message.roomId)
            return socket.send(
              JSON.stringify({ message: "incomplete request." }),
            );
          meetManager.joinRoom(user, message.roomId, socket);
          break;

        case messageTypes.MESSAGE:
          if (user.role === "ADMIN") {
            const roomId = message.roomId;
            const codeInfo = message.codeIndo;
            meetManager.handleMessage(message,socket);
          } else {
            socket.send(JSON.stringify({ message: "Only admin can send." }));
          }
          break;
        case messageTypes.END_MEETING:
          if(user.role === "ADMIN"){
            if(!message.roomId)return socket.send(JSON.stringify({message: "Need roomId to end_meeting."}));
            meetManager.endMeeting(message.roomId);
          }
          break;
        default:
          socket.send(JSON.stringify({ message: "Unknown message type." }));
      }
    });
  });
}
main();
