import { WebSocket } from "ws";
import { v4 as randomUUID } from "uuid";
import { Meet } from "./Meet";
export class Meetmanager {
  private meets: Meet[];
  constructor() {
    this.meets = [];
  }
  createRoom(user: { id: string; role: string }, socket: WebSocket) {
    if (user.role !== "ADMIN") {
      return socket.send(
        JSON.stringify({
          message: "You are not authorized to create a room.",
        }),
      );
    }

    const isEngaged = this.meets.find((x) => x.admin.id === user.id);
    if (isEngaged) {
      return socket.send(
        JSON.stringify({ message: "You already part of a room." }),
      );
    }

    const roomId = randomUUID();
    const meet = new Meet(user.id, socket, roomId);
    this.meets.push(meet);
    socket.send(
      JSON.stringify({
        type: "ROOM_CREATED",
        roomId,
      }),
    );
  }

  joinRoom(
    user: { id: string; role: string },
    roomId: string,
    socket: WebSocket,
  ) {
    if (user.role !== "USER") {
      socket.send(
        JSON.stringify({
          message: "You are not a user.",
        }),
      );
    }
    const roomData = this.meets.find((x) => x.roomId === roomId);

    if (roomData) {
      roomData.addMembers(user.id, socket);
    } else {
      socket.send(JSON.stringify({ message: "Room doesn't exist." }));
    }
  }
}
