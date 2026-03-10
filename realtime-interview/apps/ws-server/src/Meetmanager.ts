import { WebSocket } from "ws";
import { Meet } from "./Meet";
import {
  AuthSocket,
  codeInfoType,
  languageType,
  userType,
} from "./utils/types";
import { messageTypes } from "./utils/enums";
import { prisma } from "@repo/db";

export class Meetmanager {
  private meets: Map<string, Meet>;
  private userRoomMap: Map<string, string>;
  constructor() {
    this.meets = new Map();
    this.heartBeat();
    this.userRoomMap = new Map();
  }

  checkAdmin(id: string) {
    for (const val of this.meets.values()) {
      if (val.admin.id === id) return val;
    }
    return false;
  }

  async createRoom(user: userType, language: languageType, socket: WebSocket) {
    if (user.role !== "ADMIN") {
      return socket.send(
        JSON.stringify({
          message: "You are not authorized to create a room.",
        }),
      );
    }

    const isEngaged = this.checkAdmin(user.id);
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
      } else {
        return socket.send(
          JSON.stringify({
            message: "You can't create two meets simultaneously.",
          }),
        );
      }
    }
    try {
      const room = await prisma.room.create({ data: { adminId: user.id } });

      const roomId = room.id;
      const meet = new Meet(user.id, socket, language, roomId);
      this.meets.set(roomId, meet);
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
      return socket.send(
        JSON.stringify({
          message: "You are not a user.",
        }),
      );
    }
    if (this.userRoomMap.has(user.id))
      return socket.send(
        JSON.stringify({ message: "You are already part of a room." }),
      );
    const roomData = this.meets.get(roomId);

    if (roomData) {
      const existingSession = roomData.participants.get(user.id);

      if (existingSession) {
        existingSession.socket = socket;
        existingSession.lastSeen = Date.now();
        return socket.send(
          JSON.stringify({ message: "You are sucessfully added." }),
        );
      }
      this.userRoomMap.set(user.id, roomId);
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
    const adminId = (socket as AuthSocket).user.id;
    const meet = this.meets.get(roomId);
    if (!meet)
      return socket.send(
        JSON.stringify({ message: "Please check your info." }),
      );
    
    if (meet.admin.id !== adminId)
      return socket.send(
        JSON.stringify({
          message: "Only admin has the privilage to send messages.",
        }),
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
        this.userRoomMap.delete(memberId);
        break;
      case messageTypes.END_MEETING:
        const session = meet?.participants.get(adminId);
        if (!session || session?.role === "USER")
          return socket.send(
            JSON.stringify({ message: "You can't end the meeting." }),
          );
        this.endMeeting(message.roomId);
        break;
    }
  }

  endMeeting(roomId: string) {
    const meet = this.meets.get(roomId);
    meet?.saveToDB();
    meet?.admin.adminSocket.send(
        JSON.stringify({ message: "Meeting ended successfully." }),
    );

    meet?.participants.forEach((x)=>{
      x.isActive && x.socket.send(JSON.stringify({ message: "Meeting ended." }));
    })
    this.meets.delete(roomId);

    for (const [userId, userRoomId] of this.userRoomMap) {
      if (userRoomId === roomId) {
        this.userRoomMap.delete(userId);
      }
    }
  }

  callRemoveMember(id: string, roomId: string) {
    const meet = this.meets.get(roomId);
    if (!meet) {
      return;
    }
    if (meet.participants.get(id)?.role === "ADMIN") {
      return this.handleAdminDisconnect(id);
    }
    this.userRoomMap.delete(id);
    meet.removeMember(id);
  }

  handleAdminDisconnect(adminId: string) {
    const meet = this.checkAdmin(adminId);
    if (!meet) return;

    meet.cleanUpTimer = setTimeout(
      () => {
        this.endMeeting(meet.roomId);
      },
      2 * 60 * 1000,
    );
  }

  pong(userId: string) {
    const roomId = this.userRoomMap.get(userId);
    if(!roomId)return;
      const userRoom = this.meets.get(roomId)
      if(!userRoom)return;
      const user = userRoom.participants.get(userId);
      if(!user)return;
      user.isActive = true;
  }

  heartBeat() {
    setInterval(() => {
      for (const [_,meet] of this.meets) {
        for (const x of meet.participants.values()) {
          const socket = x.socket as any;
          if (!socket.Alive) {
            x.isActive = false;
            x.socket.terminate();
            x.lastSeen = Date.now();
            continue;//skip the ping on the dead socket.
          }
          socket.Alive = false;
          x.socket.ping();
        }
      }
    }, 30_000);
  }
}
