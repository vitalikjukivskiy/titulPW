import { isHost, json } from "@/lib/show";
export async function GET(request:Request){return json({host:await isHost(request)})}
