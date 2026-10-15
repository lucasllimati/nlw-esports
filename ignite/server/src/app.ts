import express, { type ErrorRequestHandler } from 'express';

import cors from 'cors';

import helmet from 'helmet';

import { rateLimit } from 'express-rate-limit';

import { z } from 'zod';

import type { PrismaClient } from './generated/prisma/client';

import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';

import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';

interface AppOptions {
  prisma: PrismaClient;
  corsOrigins: string[];
  trustProxy?: number;
}

const idParamsSchema = z.object({
  id: z.uuid(),
});

const hourSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:mm');

const createAdBodySchema = z.object({
  name: z.string().trim().min(1).max(50),
  yearsPlaying: z.number().int().min(0).max(100),
  // Usuário do Discord: formato novo (nome) ou legado (nome#1234)
  discord: z.string().trim().regex(/^[\w.]{2,32}(#\d{4})?$/, 'Usuário do Discord inválido'),
  weekDays: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1)
    .max(7)
    .transform((days) => [...new Set(days)].sort()),
  hourStart: hourSchema,
  hourEnd: hourSchema,
  useVoiceChannel: z.boolean(),
});

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function createApp({ prisma, corsOrigins, trustProxy = 0 }: AppOptions) {
  const app = express();

  // Necessário para o rate limit identificar o IP real atrás de um proxy
  app.set('trust proxy', trustProxy);

  app.use(helmet());

  app.use(cors({
    origin: corsOrigins,
    methods: ['GET', 'POST'],
  }));

  app.use(express.json({ limit: '10kb' }));

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }));

  // Limites mais rígidos para criação de anúncios (spam)
  const createAdLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });

  // ...e para leitura de contatos do Discord (scraping de dados pessoais)
  const discordLimiter = rateLimit({
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
        hourStart: convertHourStringToMinutes(body.hourStart),
        hourEnd: convertHourStringToMinutes(body.hourEnd),
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
        hourStart: convertMinutesToHourString(ad.hourStart),
        hourEnd: convertMinutesToHourString(ad.hourEnd),
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

  const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
    if (response.headersSent) {
      return next(error);
    }

    if (error instanceof z.ZodError) {
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
