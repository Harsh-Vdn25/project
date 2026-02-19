import { decodeToken } from "./lib/decodeToken";
import {v4 as randomUUID} from 'uuid';
export class Meetmanager{
    private room:{
        adminId: string;
        roomId: string;
        members: string[];
    }[] = [];
    constructor(){

    }
}