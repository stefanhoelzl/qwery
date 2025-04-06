import connect from "connect";
import {register} from "./middleware.ts";
import serveStatic from "serve-static";
import basicAuth from "basic-auth-connect";

const db = process.env.DB!;
const port = Number(process.env.PORT || 80);
const site = process.env.SITE;
const username = process.env.USERNAME;
const password = process.env.PASSWORD;

const app = connect()
if(username)  app.use(basicAuth(username, password));
if(site) app.use(serveStatic(site));
register(app, {db})
  .then(() => app.listen(port))
