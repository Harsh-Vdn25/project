import WebSocket from "ws";
export interface Meetings {
    adminId: number;
    roomId: string;
    participants: number[];
}
export class Meetmanager{
    private meetings: Meetings[];
    private socket: WebSocket;
    private adminId: number = -1;
    private memberId: number = -1;
    private roomId: string = "";
    contructor(ws: WebSocket){
        this.meetings = [];
        this.socket = ws;
        this.init();
    }
    init(){
        
    }
}