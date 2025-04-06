import { Server } from "connect";

declare module 'basic-auth-connect' {
	export default function basicAuth(username: string, password: string): Server;
}
