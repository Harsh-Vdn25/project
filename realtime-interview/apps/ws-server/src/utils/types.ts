import WebSocket from "ws";

interface AuthSocket extends WebSocket {
  id: string;
  role: string;
}
export type languageType = "javascript" | "python";
export interface userType {
  id: string;
  role: string;
}
export interface codeInfoType {
  language: languageType;
  code: string;
}
export interface ParticipantSession{
  role: "ADMIN" | "USER";
  socket: WebSocket;
  joinedAt: number;
  lastSeen: number;
  isActive: boolean;
}