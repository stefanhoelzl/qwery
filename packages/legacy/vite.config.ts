import { defineConfig } from "vite";
import {qwery} from "@qwery/vite-plugin";


export default defineConfig({
  plugins: [qwery({db: process.env["DB"]!})],
});
