"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./env");
const prisma_1 = require("./lib/prisma");
const app_1 = require("./app");
const app = (0, app_1.createApp)({
    prisma: prisma_1.prisma,
    corsOrigins: env_1.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
    trustProxy: env_1.env.TRUST_PROXY,
});
const server = app.listen(env_1.env.PORT, () => {
    console.log(`HTTP server running on port ${env_1.env.PORT}`);
});
function shutdown() {
    server.close(async () => {
        await prisma_1.prisma.$disconnect();
        process.exit(0);
    });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
