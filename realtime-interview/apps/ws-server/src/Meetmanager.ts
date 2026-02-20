import { WebSocket } from "ws";
import { v4 as randomUUID } from "uuid";
import { Meet } from "./Meet";
import { codeInfoType, languageType, userType } from "./utils/types";
import { messageTypes } from "./utils/enums";

export class Meetmanager {
  private meets: Meet[];
  constructor() {
    this.meets = [];
  }
  createRoom(user: userType, language: languageType, socket: WebSocket) {
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
    const meet = new Meet(user.id, socket, language, roomId);
    this.meets.push(meet);
    socket.send(
      JSON.stringify({
        type: "ROOM_CREATED",
        roomId,
      }),
    );
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
      for (let x of this.meets) {
        if (x.members.find((person) => person.id === user.id)) {
          return socket.send(
            JSON.stringify({
              message: "You already part of the room.",
              roomId: x.roomId,
            }),
          );
        }
      }
      roomData.addMember(user.id, socket);
    } else {
      socket.send(JSON.stringify({ message: "Room doesn't exist." }));
    }
  }

  handleMessage(
    message: {
      type: messageTypes.SEND_CODE | messageTypes.REMOVE_MEMBER;
      roomId: string;
      codeInfo?: codeInfoType;
      memberId?: string;
    },
    socket: WebSocket,
  ) {
    const roomId = message.roomId;
    const adminId = (socket as any).id;
    const meet = this.meets.find(
      (x) => x.roomId === roomId && x.admin.id === adminId
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
              message: "Please send the code and the language."
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
        meet.removeMember(memberId,socket);
    }
  }

  endMeeting(roomId: string){
    for(let i=0;i<this.meets.length;i++){
      console.log(this.meets[i]?.roomId);
      if(this.meets[i]?.roomId === roomId){
        this.meets[i]?.admin.adminSocket.send(JSON.stringify({message: "Meeting ended successfully."}));
        this.meets[i]?.members.map(x=>x.member.send(JSON.stringify({message: "Meeting ended."})));
        this.meets.splice(i,1);
        break;
      }
    }
  }
}
