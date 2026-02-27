import { WebSocket } from "ws";
import { codeInfoType, languageType, ParticipantSession } from "./utils/types";
import { prisma } from "@repo/db";

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
  public cleanUpTimer: any;
  public adminDisconnectedAt: Date | undefined;
  public participants: Map<string, ParticipantSession>;
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
    this.participants = new Map();
    this.members = [];
    this.roomId = roomId;
    this.codeInfo = { language, code: "" };
    this.startTime = Date.now();
    this.cleanUpTimer = undefined;
    this.adminDisconnectedAt = undefined;
  }

  addMember(id: string, member: WebSocket) {
    this.members.push({ id, member });
    this.participants.set(id, {
      socket: member,
      role: "USER",
      joinedAt: Date.now(),
      lastSeen: Date.now()
    });

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

  removeMember(memberId: string) {
    var removed = false;
    for (let i = 0; i < this.members.length; i++) {
      if (this.members[i]?.id === memberId) {
        this.members.splice(i, 1);
        removed = true;
        break;
      }
    }
    
    const member = this.participants.get(memberId);
    member!.lastSeen = Date.now();
    if (removed) {
      return this.admin.adminSocket.send(
        JSON.stringify({ memberId: memberId, message: "Removed the user" }),
      );
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
