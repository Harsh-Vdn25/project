import { WebSocketServer } from "ws";
import { decodeToken } from "./lib/decodeToken";
import { Meetmanager } from "./Meetmanager";
import { messageTypes } from "./utils/enums";
import { AuthSocket } from "./utils/types";

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
      (socket as AuthSocket).user = { id: decoded.id, role: decoded.role };
      socket.send(JSON.stringify({ message: "Connection successful." }));
    } else {
      return socket.send(
        JSON.stringify(JSON.stringify({ message: "Invalid role." })),
      );
    }

    socket.on("message", (data) => {
      const strData = data.toString();
      const message = JSON.parse(strData);
      const user = (socket as AuthSocket).user;

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
            meetManager.handleMessage(message, socket);
          } else {
            socket.send(JSON.stringify({ message: "Only admin can send." }));
          }
          break;
        case messageTypes.END_MEETING:
          meetManager.handleMessage(message, socket);
          break;
        default:
          socket.send(JSON.stringify({ message: "Unknown message type." }));
      }
    });

    socket.on("pong", () => {
      const user = (socket as AuthSocket).user;
      (socket as any).Alive = true;
      meetManager.pong(user.id);
    });
    socket.on("close", () => {
      const user = (socket as AuthSocket).user;
      const roomId = (socket as any).roomId;
      meetManager.callRemoveMember(user.id, roomId);
    });
  });
}
main();
