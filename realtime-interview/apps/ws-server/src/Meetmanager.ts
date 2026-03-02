import { WebSocket } from "ws";
import { Meet } from "./Meet";
import { codeInfoType, languageType, userType } from "./utils/types";
import { messageTypes } from "./utils/enums";
import { prisma } from "@repo/db";

export class Meetmanager {
  private meets: Meet[];
  constructor() {
    this.meets = [];
  }

  async createRoom(user: userType, language: languageType, socket: WebSocket) {
    if (user.role !== "ADMIN") {
      return socket.send(
        JSON.stringify({
          message: "You are not authorized to create a room.",
        }),
      );
    }

    const isEngaged = this.meets.find((x) => x.admin.id === user.id);
    if (isEngaged) {
      if (isEngaged.cleanUpTimer) {
        isEngaged.admin.adminSocket = socket;
        isEngaged.handleAdminRejoin();

        return socket.send(
          JSON.stringify({
            type: messageTypes.ADMIN_RECONNECTED,
            message: "You reconnected to the room.",
          }),
        );
      }
    }
    try {
      const room = await prisma.room.create({ data: { adminId: user.id } });

      const roomId = room.id;
      const meet = new Meet(user.id, socket, language, roomId);
      this.meets.push(meet);
      (socket as any).roomId = roomId;
      socket.send(
        JSON.stringify({
          type: "ROOM_CREATED",
          roomId,
        }),
      );
    } catch (err) {
      console.log(err);
      socket.send(JSON.stringify({ message: "Failed to create a meet." }));
    }
  }

  joinRoom(user: userType, roomId: string, socket: WebSocket) {
    if (user.role !== "USER") {
      socket.send(
        JSON.stringify({
          message: "You are not a user.",
        }),
      );
    }
    const roomData = this.meets.find((x) => x.roomId === roomId);

    if (roomData) {
      const existingSession = roomData.participants.get(user.id);
      if (existingSession) {
        existingSession.socket = socket;
        existingSession.lastSeen = Date.now();
        return socket.send(
          JSON.stringify({ message: "You are sucessfully added." }),
        );
      }
      roomData.addMember(user.id, socket);
      (socket as any).roomId = roomId;
    } else {
      socket.send(JSON.stringify({ message: "Room doesn't exist." }));
    }
  }

  handleMessage(
    message: {
      type:
        | messageTypes.SEND_CODE
        | messageTypes.REMOVE_MEMBER
        | messageTypes.END_MEETING;
      roomId: string;
      codeInfo?: codeInfoType;
      memberId?: string;
    },
    socket: WebSocket,
  ) {
    const roomId = message.roomId;
    const adminId = (socket as any).user.id;
    const meet = this.meets.find(
      (x) => x.roomId === roomId && x.admin.id === adminId,
    );

    if (!meet)
      return socket.send(
        JSON.stringify({ message: "Please check your info." }),
      );

    switch (message.type) {
      case messageTypes.SEND_CODE:
        const codeInfo = message.codeInfo;

        if (!codeInfo)
          return socket.send(
            JSON.stringify({
              message: "Please send the code and the language.",
            }),
          );
        meet.sendCode(codeInfo);
        break;
      case messageTypes.REMOVE_MEMBER:
        const memberId = message.memberId;
        if (!memberId) {
          return socket.send(
            JSON.stringify({
              message: "Please provide the memberId to remove.",
            }),
          );
        }
        meet.removeMember(memberId);
        break;
      case messageTypes.END_MEETING:
        if (!message.memberId)
          return socket.send(JSON.stringify({ message: "Invalid request" }));

        const session = meet?.participants.get(message.memberId);
        if (!session || session?.role === "USER")
          return socket.send(
            JSON.stringify({ message: "You can't end the meeting." }),
          );
        this.endMeeting(message.roomId);
        break;
    }
  }

  endMeeting(roomId: string) {
    for (let i = 0; i < this.meets.length; i++) {
      if (this.meets[i]?.roomId === roomId) {
        this.meets[i]?.saveToDB(); //writing all the members of a meet into the DB;
        this.meets[i]?.admin.adminSocket.send(
          JSON.stringify({ message: "Meeting ended successfully." }),
        );
        this.meets[i]?.participants.forEach((x) => {
          x.isActive &&
            x.socket.send(JSON.stringify({ message: "Meeting ended." }));
        });
        this.meets.splice(i, 1);
        break;
      }
    }
  }

  callRemoveMember(id: string, roomId: string) {
    const meet = this.meets.find((x) => x.roomId === roomId);
    if (!meet) {
      return;
    }
    const member = meet?.participants.get(id);
    if (meet.participants.get(id)?.role === "ADMIN") {
      return this.handleAdminDisconnect(id);
    }
    meet.removeMember(id);
  }

  handleAdminDisconnect(adminId: string) {
    const meet = this.meets.find((x) => x.admin.id === adminId);
    if (!meet) return;
    
    meet.cleanUpTimer = setTimeout(
      () => {
        this.endMeeting(meet.roomId);
      },
      2 * 60 * 1000,
    );
  }
}
