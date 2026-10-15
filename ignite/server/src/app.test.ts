import { after, before, describe, it } from 'node:test';

import assert from 'node:assert/strict';

import type { AddressInfo } from 'node:net';

import type { Server } from 'node:http';

import type { PrismaClient } from './generated/prisma/client';

import { createApp } from './app';

import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';

import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';

const GAME_ID = '0b521984-5b27-42fc-8ec2-0873f7a02e99';
const AD_ID = '6f1d1c4e-8f7a-4b5e-9d2a-3c4b5a6d7e8f';

const createdAds: unknown[] = [];

// Stub mínimo do Prisma: os testes cobrem a camada HTTP, não o banco
const prismaStub = {
  game: {
    findMany: async () => [],
    findUnique: async ({ where }: { where: { id: string } }) => (where.id === GAME_ID ? { id: GAME_ID } : null),
  },
  ad: {
    create: async ({ data }: { data: unknown }) => {
      createdAds.push(data);
      return { id: AD_ID };
    },
    findMany: async () => [],
    findUnique: async ({ where }: { where: { id: string } }) => (where.id === AD_ID ? { discord: 'player.one' } : null),
  },
} as unknown as PrismaClient;

const validAd = {
  name: 'Player',
  yearsPlaying: 3,
  discord: 'player.one',
  weekDays: [5, 6, 0],
  hourStart: '18:00',
  hourEnd: '23:30',
  useVoiceChannel: true,
};

let server: Server;
let baseUrl: string;

before(() => {
  const app = createApp({ prisma: prismaStub, corsOrigins: ['http://localhost:5173'] });
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

function postAd(gameId: string, body: unknown) {
  return fetch(`${baseUrl}/games/${gameId}/ads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('utils', () => {
  it('converte HH:mm para minutos como número', () => {
    assert.equal(convertHourStringToMinutes('18:00'), 1080);
    assert.equal(convertHourStringToMinutes('00:05'), 5);
  });

  it('converte minutos para HH:mm', () => {
    assert.equal(convertMinutesToHourString(1080), '18:00');
    assert.equal(convertMinutesToHourString(5), '00:05');
  });
});

describe('POST /games/:id/ads', () => {
  it('cria um anúncio válido', async () => {
    const response = await postAd(GAME_ID, validAd);

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { id: AD_ID });
    assert.deepEqual(createdAds.at(-1), {
      gameId: GAME_ID,
      name: 'Player',
      yearsPlaying: 3,
      discord: 'player.one',
      weekDays: '0,5,6',
      hourStart: 1080,
      hourEnd: 1410,
      usevoiceChannel: true,
    });
  });

  it('rejeita payload inválido com 400 sem derrubar o servidor', async () => {
    const response = await postAd(GAME_ID, { ...validAd, weekDays: 'all', hourStart: '25:00' });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.message, 'Validation error');
  });

  it('rejeita JSON malformado com 400', async () => {
    const response = await postAd(GAME_ID, '{"name":');

    assert.equal(response.status, 400);
    assert.doesNotMatch(await response.text(), /at .*\.js/);
  });

  it('rejeita payload acima do limite com 413', async () => {
    const response = await postAd(GAME_ID, { ...validAd, name: 'a'.repeat(20_000) });

    assert.equal(response.status, 413);
  });

  it('retorna 400 para id que não é UUID', async () => {
    const response = await postAd('not-a-uuid', validAd);

    assert.equal(response.status, 400);
  });

  it('retorna 404 para jogo inexistente', async () => {
    const response = await postAd('11111111-1111-4111-8111-111111111111', validAd);

    assert.equal(response.status, 404);
  });
});

describe('GET /ads/:id/discord', () => {
  it('retorna o discord do anúncio', async () => {
    const response = await fetch(`${baseUrl}/ads/${AD_ID}/discord`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { discord: 'player.one' });
  });

  it('retorna 404 (e não 500) para anúncio inexistente', async () => {
    const response = await fetch(`${baseUrl}/ads/11111111-1111-4111-8111-111111111111/discord`);

    assert.equal(response.status, 404);
  });
});

describe('segurança', () => {
  it('envia headers de segurança e oculta o X-Powered-By', async () => {
    const response = await fetch(`${baseUrl}/games`);

    assert.equal(response.headers.get('x-powered-by'), null);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  });

  it('não libera CORS para origens desconhecidas', async () => {
    const response = await fetch(`${baseUrl}/games`, { headers: { Origin: 'https://evil.example' } });

    assert.equal(response.headers.get('access-control-allow-origin'), null);
  });

  it('libera CORS para a origem configurada', async () => {
    const response = await fetch(`${baseUrl}/games`, { headers: { Origin: 'http://localhost:5173' } });

    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });
});
