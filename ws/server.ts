import { WebSocketServer } from "ws";

const main=async()=>{
    const wss = new WebSocketServer({port: 8080});
    wss.on('connection',(socket,request)=>{
        const url = request.url;
        const queryParams = new URLSearchParams(url?.split("?")[1]);
        const token = queryParams.get("token");
        if(!token){
            return socket.send(JSON.stringify({message: "Please provide the token."}));
        }
        
    })
}