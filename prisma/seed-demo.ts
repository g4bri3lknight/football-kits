import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
};

async function main() {
  console.log('🌱 Seeding demo data...');

  // Get all nations (needed for finding by code)
  const nations = await prisma.nation.findMany();
  
  if (nations.length === 0) {
    console.log('❌ No nations found. Run the seed API first.');
    return;
  }

  // Sample goalkeepers (using ISO country codes)
  const goalkeepers = [
    { name: 'Gianluigi', surname: 'Buffon', nationCode: 'IT' },
    { name: 'Iker', surname: 'Casillas', nationCode: 'ES' },
    { name: 'Manuel', surname: 'Neuer', nationCode: 'DE' },
    { name: 'Petr', surname: 'Cech', nationCode: 'CZ' },
    { name: 'Edwin', surname: 'van der Sar', nationCode: 'NL' },
    { name: 'Oliver', surname: 'Kahn', nationCode: 'DE' },
    { name: 'Dino', surname: 'Zoff', nationCode: 'IT' },
    { name: 'Lev', surname: 'Yashin', nationCode: 'RU' },
    { name: 'Peter', surname: 'Schmeichel', nationCode: 'DK' },
    { name: 'Thibaut', surname: 'Courtois', nationCode: 'BE' },
  ];

  // Sample kits
  const kitTemplates = [
    { name: '2020/2021', team: 'Juventus', type: 'home' },
    { name: '2020/2021', team: 'Juventus', type: 'away' },
    { name: '2019/2020', team: 'Juventus', type: 'home' },
    { name: '2018/2019', team: 'Paris Saint-Germain', type: 'home' },
    { name: '2018/2019', team: 'Paris Saint-Germain', type: 'away' },
    { name: '2010/2011', team: 'Real Madrid', type: 'home' },
    { name: '2010/2011', team: 'Real Madrid', type: 'away' },
    { name: '2016/2017', team: 'Real Madrid', type: 'home' },
    { name: '2014/2015', team: 'Bayern Munich', type: 'home' },
    { name: '2014/2015', team: 'Bayern Munich', type: 'away' },
    { name: '2013/2014', team: 'Chelsea', type: 'home' },
    { name: '2012/2013', team: 'Chelsea', type: 'home' },
    { name: '2007/2008', team: 'Manchester United', type: 'home' },
    { name: '2007/2008', team: 'Manchester United', type: 'away' },
    { name: '1995/1996', team: 'Juventus', type: 'home' },
    { name: '1982/1983', team: 'Italy', type: 'home' },
    { name: '2006/2007', team: 'Italy', type: 'home' },
    { name: '2010/2011', team: 'Spain', type: 'home' },
    { name: '2008/2009', team: 'Germany', type: 'home' },
    { name: '2014/2015', team: 'Germany', type: 'home' },
  ];

  // Create players and kits
  for (const gk of goalkeepers) {
    const nation = nations.find(n => n.code === gk.nationCode) || nations[0];
    
    const player = await prisma.player.create({
      data: {
        id: generateId(),
        name: gk.name,
        surname: gk.surname,
        nationId: nation.id,
        status: Math.random() > 0.7 ? 'NUOVO' : (Math.random() > 0.5 ? 'AGGIORNATO' : 'NON_IMPOSTATO'),
        hasImage: false,
        updatedAt: new Date(),
      },
    });

    // Create 2-4 random kits for each player
    const numKits = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numKits; i++) {
      const kitTemplate = kitTemplates[Math.floor(Math.random() * kitTemplates.length)];
      
      const kit = await prisma.kit.create({
        data: {
          id: generateId(),
          name: kitTemplate.name,
          team: kitTemplate.team,
          type: kitTemplate.type,
          hasImage: false,
          hasLogo: false,
          status: Math.random() > 0.8 ? 'NUOVO' : 'NON_IMPOSTATO',
          updatedAt: new Date(),
        },
      });

      await prisma.playerKit.create({
        data: {
          id: generateId(),
          playerId: player.id,
          kitId: kit.id,
          updatedAt: new Date(),
        },
      });
    }

    console.log(`✅ Created: ${gk.name} ${gk.surname}`);
  }

  console.log('🎉 Demo data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
