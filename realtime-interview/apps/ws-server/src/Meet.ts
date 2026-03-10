import { WebSocket } from "ws";
import { codeInfoType, languageType, ParticipantSession } from "./utils/types";
import { prisma } from "@repo/db";

export class Meet {
  public admin: {
    id: string;
    adminSocket: WebSocket;
  };
  public roomId: string;
  //lets consider the coding language is same for all the members
  private codeInfo: codeInfoType;
  private startTime: number;
  public cleanUpTimer: any;
  public adminDisconnectedAt: Date | undefined;
  public participants: Map<string, ParticipantSession> = new Map();
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
    this.participants.set(adminId, {
      socket,
      role: "ADMIN",
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      isActive: true,
    });
    this.roomId = roomId;
    this.codeInfo = { language, code: "" };
    this.startTime = Date.now();
    this.cleanUpTimer = undefined;
    this.adminDisconnectedAt = undefined;
  }

  addMember(id: string, member: WebSocket) {
    this.participants.set(id, {
      socket: member,
      role: "USER",
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      isActive: true,
    });

    member.send(
      JSON.stringify({
        type: "JOINED_ROOM",
        roomId: this.roomId,
      }),
    );

    member.send(
      JSON.stringify({
        type: "CODE_SNAPSHOT",
        codeInfo: this.codeInfo,
      }),
    );
  }

  sendCode(codeInfo: codeInfoType) {
    this.codeInfo = codeInfo;
    for (const p of this.participants.values()) {
      if (p.isActive && p.role === "USER") {
        p.socket.send(
          JSON.stringify({ type: "CODE_SNAPSHOT", codeInfo: this.codeInfo }),
        );
      }
    }
  }

  removeMember(memberId: string) {
    const member = this.participants.get(memberId);
    if (!member) {
      return this.admin.adminSocket.send(
        JSON.stringify({ message: "User with the given id doesn't exist." }),
      );
    }
    member!.lastSeen = Date.now();
    member!.isActive = false;
    if(member.socket.readyState === WebSocket.OPEN){
      member.socket.close();
    }
  }

  handleAdminRejoin() {
    clearTimeout(this.cleanUpTimer);
    this.cleanUpTimer = undefined;
    this.adminDisconnectedAt = undefined;
  }

  async saveToDB() {
    const roomMember = [...this.participants].map(([userId, value]) => ({
      roomId: this.roomId,
      userId: userId,
      joinedAt: value.joinedAt,
      leftAt: value!.lastSeen,
    }));

    try {
      await prisma.roomMember.createMany({
        data: roomMember,
      });
    } catch (err) {
      console.log(err);
    }
  }
}
