import { prisma } from '../src/lib/prisma';

const games = [
  { id: '0b521984-5b27-42fc-8ec2-0873f7a02e99', title: 'Cities: Skylines', bannerUrl: 'https://static-cdn.jtvnw.net/ttv-boxart/461449_IGDB-144x192.jpg' },
  { id: '2198a661-adfe-40f6-b862-d8aced61aff0', title: 'F1 2022', bannerUrl: 'https://static-cdn.jtvnw.net/ttv-boxart/1705795372_IGDB-188x250.jpg' },
  { id: '2d3884c1-7b3b-4ded-bd02-1bedbad2c8f1', title: 'Call of Duty: Modern Warfare II', bannerUrl: 'https://static-cdn.jtvnw.net/ttv-boxart/1678052513_IGDB-188x250.jpg' },
  { id: '420f4ffb-da43-410c-b1b5-d7c8c17c7259', title: 'Fortnite', bannerUrl: 'https://static-cdn.jtvnw.net/ttv-boxart/33214-188x250.jpg' },
  { id: '908c68bc-7551-4826-b1ef-6e5014ebd914', title: 'God of War', bannerUrl: 'https://static-cdn.jtvnw.net/ttv-boxart/6369_IGDB-144x192.jpg' },
  { id: 'c852cd6f-dd9c-4e80-ba0d-4fb43780f9de', title: 'Euro Truck Simulator 2', bannerUrl: 'https://static-cdn.jtvnw.net/ttv-boxart/75467_IGDB-144x192.jpg' },
];

async function main() {
  for (const game of games) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: { title: game.title, bannerUrl: game.bannerUrl },
      create: game,
    });
  }

  console.log(`Seed concluído: ${games.length} jogos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
