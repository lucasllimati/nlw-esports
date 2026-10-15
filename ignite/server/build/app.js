"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const zod_1 = require("zod");
const convert_hour_string_to_minutes_1 = require("./utils/convert-hour-string-to-minutes");
const convert_minutes_to_hour_string_1 = require("./utils/convert-minutes-to-hour-string");
const idParamsSchema = zod_1.z.object({
    id: zod_1.z.uuid(),
});
const hourSchema = zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:mm');
const createAdBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(50),
    yearsPlaying: zod_1.z.number().int().min(0).max(100),
    // Usuário do Discord: formato novo (nome) ou legado (nome#1234)
    discord: zod_1.z.string().trim().regex(/^[\w.]{2,32}(#\d{4})?$/, 'Usuário do Discord inválido'),
    weekDays: zod_1.z
        .array(zod_1.z.coerce.number().int().min(0).max(6))
        .min(1)
        .max(7)
        .transform((days) => [...new Set(days)].sort()),
    hourStart: hourSchema,
    hourEnd: hourSchema,
    useVoiceChannel: zod_1.z.boolean(),
});
class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.HttpError = HttpError;
function createApp({ prisma, corsOrigins, trustProxy = 0 }) {
    const app = (0, express_1.default)();
    // Necessário para o rate limit identificar o IP real atrás de um proxy
    app.set('trust proxy', trustProxy);
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: corsOrigins,
        methods: ['GET', 'POST'],
    }));
    app.use(express_1.default.json({ limit: '10kb' }));
    app.use((0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        limit: 300,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
    }));
    // Limites mais rígidos para criação de anúncios (spam)
    const createAdLimiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 60 * 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
    });
    // ...e para leitura de contatos do Discord (scraping de dados pessoais)
    const discordLimiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        limit: 30,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
    });
    app.get('/games', async (request, response) => {
        const games = await prisma.game.findMany({
            include: {
                _count: {
                    select: {
                        ads: true,
                    }
                }
            }
        });
        return response.json(games);
    });
    app.post('/games/:id/ads', createAdLimiter, async (request, response) => {
        const { id: gameId } = idParamsSchema.parse(request.params);
        const body = createAdBodySchema.parse(request.body);
        const game = await prisma.game.findUnique({
            select: { id: true },
            where: { id: gameId },
        });
        if (!game) {
            throw new HttpError(404, 'Game not found');
        }
        const ad = await prisma.ad.create({
            data: {
                gameId,
                name: body.name,
                yearsPlaying: body.yearsPlaying,
                discord: body.discord,
                weekDays: body.weekDays.join(','),
                hourStart: (0, convert_hour_string_to_minutes_1.convertHourStringToMinutes)(body.hourStart),
                hourEnd: (0, convert_hour_string_to_minutes_1.convertHourStringToMinutes)(body.hourEnd),
                usevoiceChannel: body.useVoiceChannel,
            }
        });
        return response.status(201).json({ id: ad.id });
    });
    app.get('/games/:id/ads', async (request, response) => {
        const { id: gameId } = idParamsSchema.parse(request.params);
        const ads = await prisma.ad.findMany({
            select: {
                id: true,
                name: true,
                weekDays: true,
                usevoiceChannel: true,
                yearsPlaying: true,
                hourStart: true,
                hourEnd: true,
            },
            where: {
                gameId,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return response.json(ads.map(({ usevoiceChannel, ...ad }) => {
            return {
                ...ad,
                useVoiceChannel: usevoiceChannel,
                weekDays: ad.weekDays.split(',').map(Number),
                hourStart: (0, convert_minutes_to_hour_string_1.convertMinutesToHourString)(ad.hourStart),
                hourEnd: (0, convert_minutes_to_hour_string_1.convertMinutesToHourString)(ad.hourEnd),
            };
        }));
    });
    app.get('/ads/:id/discord', discordLimiter, async (request, response) => {
        const { id: adId } = idParamsSchema.parse(request.params);
        const ad = await prisma.ad.findUnique({
            select: {
                discord: true,
            },
            where: {
                id: adId,
            }
        });
        if (!ad) {
            throw new HttpError(404, 'Ad not found');
        }
        return response.json({
            discord: ad.discord,
        });
    });
    app.use((request, response) => {
        response.status(404).json({ message: 'Not found' });
    });
    const errorHandler = (error, request, response, next) => {
        if (response.headersSent) {
            return next(error);
        }
        if (error instanceof zod_1.z.ZodError) {
            return response.status(400).json({
                message: 'Validation error',
                issues: error.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
            });
        }
        if (error instanceof HttpError) {
            return response.status(error.status).json({ message: error.message });
        }
        // Erros do body-parser (JSON malformado, payload grande demais etc.)
        if (typeof error?.status === 'number' && error.status >= 400 && error.status < 500) {
            return response.status(error.status).json({ message: error.expose ? error.message : 'Bad request' });
        }
        // Nunca expor stack trace ou detalhes do banco ao cliente
        console.error(error);
        return response.status(500).json({ message: 'Internal server error' });
    };
    app.use(errorHandler);
    return app;
}
