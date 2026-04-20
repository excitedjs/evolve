import { createChannelServer } from "./server";

const PORT = parseInt(process.env.CHANNEL_PORT || "3000", 10);

createChannelServer(PORT);
