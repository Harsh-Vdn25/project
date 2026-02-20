import { WebSocket } from "ws";
import { codeInfoType, languageType } from "./utils/types";

export class Meet {
  public admin: {
    id: string;
    adminSocket: WebSocket;
  };
  public roomId: string;
  public members: {
    id: string;
    member: WebSocket;
  }[];
  //lets consider the coding language is same for all the members
  private codeInfo: codeInfoType;
  private startTime: number;
  constructor(
    adminId: string,
    socket: WebSocket,
    language: languageType,
    roomId: string,
  ) {
    this.admin = {
      id: adminId,
      adminSocket: socket,
    };
    this.members = [];
    this.roomId = roomId;
    this.codeInfo = { language, code: "" };
    this.startTime = Date.now();
  }

  addMember(id: string, member: WebSocket) {
    this.members.push({ id, member });
    member.send(
      JSON.stringify({
        type: "JOINED_ROOM",
        roomId: this.roomId,
      }),
    );
    this.sendCode(this.codeInfo);
  }

  sendCode(codeInfo: codeInfoType) {
    this.codeInfo = codeInfo;
    this.members.map((x) =>
      x.member.send(
        JSON.stringify({ type: "CODE_SNAPSHOT", codeInfo: this.codeInfo }),
      ),
    );
  }

  removeMember(memberId: string, adminSocket: WebSocket) {
    var removed = false;
    for (let i = 0; i < this.members.length; i++) {
      if (this.members[i]?.id === memberId) {
        this.members.splice(i, 1);
        removed = true;
        break;
      }
    }
    if (removed) {
      return adminSocket.send(
        JSON.stringify({ memberId: memberId, message: "Removed the user" }),
      );
    }
  }
}
