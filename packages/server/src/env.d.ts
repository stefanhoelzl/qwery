declare module "basic-auth-connect" {
  import { Server } from "connect";
  export default function basicAuth(username: string, password: string): Server;
}
