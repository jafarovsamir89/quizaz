import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cities of Azerbaijan
  const cities = [
    { nameAz: 'Bakı', nameEn: 'Baku', slug: 'baku' },
    { nameAz: 'Gəncə', nameEn: 'Ganja', slug: 'ganja' },
    { nameAz: 'Sumqayıt', nameEn: 'Sumqayit', slug: 'sumqayit' },
    { nameAz: 'Lənkəran', nameEn: 'Lankaran', slug: 'lankaran' },
    { nameAz: 'Şəki', nameEn: 'Shaki', slug: 'shaki' },
    { nameAz: 'Şamaxı', nameEn: 'Shamakhi', slug: 'shamaxı' },
    { nameAz: 'Quba', nameEn: 'Quba', slug: 'quba' },
    { nameAz: 'Naxçıvan', nameEn: 'Nakhchivan', slug: 'nakhchivan' },
    { nameAz: 'Mingəçevir', nameEn: 'Mingachevir', slug: 'mingacevir' },
    { nameAz: 'Xankəndi', nameEn: 'Khankendi', slug: 'xankendi' },
    { nameAz: 'Şuşa', nameEn: 'Shusha', slug: 'shusha' },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: {},
      create: city,
    });
  }

  // Basic Categories
  const categories = [
    { nameAz: 'Azərbaycan Tarixi', iconUrl: 'history' },
    { nameAz: 'Azərbaycan Coğrafiyası', iconUrl: 'geography' },
    { nameAz: 'Qarabağ', iconUrl: 'karabakh' },
    { nameAz: 'Bakı və Rayonlar', iconUrl: 'map' },
    { nameAz: 'Azərbaycan Mədəniyyəti', iconUrl: 'culture' },
    { nameAz: 'Musiqi', iconUrl: 'music' },
    { nameAz: 'Kino və Seriallar', iconUrl: 'cinema' },
    { nameAz: 'Futbol və İdman', iconUrl: 'sports' },
    { nameAz: 'Dünya Bilikləri', iconUrl: 'globe' },
  ];

  for (const category of categories) {
    await prisma.category.create({
      data: category,
    });
  }

  console.log('Seed categories completed.');

  // Import Questions
  const fs = require('fs');
  const path = require('path');
  const questionsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions_200.json'), 'utf8'));

  for (const q of questionsData) {
    const category = await prisma.category.findFirst({
      where: { nameAz: q.categoryName },
    });

    if (category) {
      await prisma.question.create({
        data: {
          textAz: q.textAz,
          options: q.options,
          correctOption: q.correctOption,
          difficulty: q.difficulty,
          explanationAz: q.explanationAz || null,
          categoryId: category.id,
          status: 'active',
        },
      });
    }
  }

  console.log(`Seed completed. Imported ${questionsData.length} questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
