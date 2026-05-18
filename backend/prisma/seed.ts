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
    const existing = await prisma.category.findFirst({ where: { nameAz: category.nameAz } });
    if (!existing) {
      await prisma.category.create({
        data: category,
      });
    }
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
      const existingQ = await prisma.question.findFirst({ where: { textAz: q.textAz } });
      if (!existingQ) {
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
  }

  // Seed Russian questions pool
  const ruQuestions = [
    {
      categoryName: 'Azərbaycan Tarixi',
      textAz: 'Кто был основателем государства Сефевидов?',
      options: { a: 'Шах Исмаил Хатаи', b: 'Шах Аббас I', c: 'Шах Тахмасиб', d: 'Надир-шах' },
      correctOption: 'a',
      difficulty: 1,
      language: 'ru',
      explanationAz: 'Шах Исмаил Хатаи основал государство Сефевидов в 1501 году.',
    },
    {
      categoryName: 'Azərbaycan Coğrafiyası',
      textAz: 'Какая самая высокая горная вершина Азербайджана?',
      options: { a: 'Шахдаг', b: 'Базардюзю', c: 'Муровдаг', d: 'Капыджик' },
      correctOption: 'b',
      difficulty: 1,
      language: 'ru',
      explanationAz: 'Вершина Базардюзю является самой высокой точкой Азербайджана (4466 метров).',
    },
    {
      categoryName: 'Azərbaycan Mədəniyyəti',
      textAz: 'Кто написал знаменитую оперу "Лейли и Меджнун"?',
      options: { a: 'Кара Караев', b: 'Фикрет Амиров', c: 'Узеир Гаджибейли', d: 'Ниязи' },
      correctOption: 'c',
      difficulty: 1,
      language: 'ru',
      explanationAz: 'Первая на Востоке опера "Лейли и Меджнун" была написана Узеиром Гаджибейли в 1907 году.',
    },
    {
      categoryName: 'Qarabağ',
      textAz: 'Какое растение является символом города Шуша и всего Карабаха?',
      options: { a: 'Хары-бюльбюль', b: 'Альпийская роза', c: 'Горный тюльпан', d: 'Карабахская гвоздика' },
      correctOption: 'a',
      difficulty: 1,
      language: 'ru',
      explanationAz: 'Эндемичный цветок Хары-бюльбюль является символом города Шуша.',
    },
    {
      categoryName: 'Azərbaycan Coğrafiyası',
      textAz: 'Какое живописное озеро называют "жемчужиной Азербайджана"?',
      options: { a: 'Маралгёль', b: 'Гёйгёль', c: 'Ноургёль', d: 'Батабат' },
      correctOption: 'b',
      difficulty: 1,
      language: 'ru',
      explanationAz: 'Озеро Гёйгёль образовалось в результате землетрясения 1139 года и признано жемчужиной природы.',
    },
  ];

  for (const q of ruQuestions) {
    const category = await prisma.category.findFirst({
      where: { nameAz: q.categoryName },
    });

    if (category) {
      const existingQ = await prisma.question.findFirst({ where: { textAz: q.textAz } });
      if (!existingQ) {
        await prisma.question.create({
          data: {
            textAz: q.textAz,
            options: q.options,
            correctOption: q.correctOption,
            difficulty: q.difficulty,
            explanationAz: q.explanationAz || null,
            categoryId: category.id,
            language: q.language,
            status: 'active',
          },
        });
      }
    }
  }

  console.log(`Seed completed. Imported ${questionsData.length} AZ questions and ${ruQuestions.length} RU questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
