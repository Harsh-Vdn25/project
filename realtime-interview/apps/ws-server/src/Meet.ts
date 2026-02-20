import { WebSocket } from "ws";

export class Meet {
  public admin: {
    id: string;
    adminSocket: WebSocket;
  };
  public roomId: string;
  private members: {
    id: string;
    member: WebSocket;
  }[];
  constructor(adminId: string, socket: WebSocket, roomId: string) {
    this.admin = {
      id: adminId,
      adminSocket: socket,
    };
    this.members = [];
    this.roomId = roomId;
  }
  addMembers(id: string, member: WebSocket) {
    if (this.members.find((x) => x.id === id)) {
      return member.send(
        JSON.stringify({ message: "You already part of the room." }),
      );
    }
    this.members.push({ id, member });
    member.send(
      JSON.stringify({
        type: "JOINED_ROOM",
        roomId: this.roomId,
      }),
    );
  }
  removeMembers() {}
}
