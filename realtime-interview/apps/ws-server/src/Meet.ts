import { WebSocket } from "ws";
import { codeInfoType, languageType } from "./utils/types";
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
  private membersMap: Map<
    string,
    {
      joinedAt: number;
      leftAt?: number;
    }
  >;
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
    this.cleanUpTimer = undefined;
    this.adminDisconnectedAt = undefined;
  }

  addMember(id: string, member: WebSocket) {
    this.members.push({ id, member });
    this.membersMap.set(id, { joinedAt: Date.now() });

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

    const member = this.membersMap.get(memberId);
    member!.leftAt = Date.now();
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
    const roomMember = [...this.membersMap].map(([userId, value]) => ({
      roomId: this.roomId,
      userId: userId,
      joinedAt: value.joinedAt,
      leftAt: value.leftAt,
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
