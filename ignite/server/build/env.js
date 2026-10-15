"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(3333),
    DATABASE_URL: zod_1.z.string().min(1),
    // Lista de origens permitidas separadas por vírgula
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
    // Quantidade de proxies reversos confiáveis (0 = acesso direto)
    TRUST_PROXY: zod_1.z.coerce.number().int().min(0).default(0),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Variáveis de ambiente inválidas:', zod_1.z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
