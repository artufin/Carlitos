// Seed with sample data. Run with `pnpm db:seed` (requires DATABASE_URL).
// Safe to run multiple times: topics and news are upserted by slug/title.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Configurable topic list. Add or rename topics here. */
export const TOPICS = [
  { slug: "vida-universitaria", name: "Vida universitaria", emoji: "🎓", description: "Carretes, actividades y comunidad." },
  { slug: "rol-publico", name: "Rol público", emoji: "🏛️", description: "Voluntariado, debates y vinculación con el medio." },
  { slug: "feminismo", name: "Feminismo y género", emoji: "💜", description: "Equidad, protocolos y actividades de la vocalía." },
  { slug: "academico", name: "Académico", emoji: "📚", description: "Tomas de ramos, evaluaciones y becas." },
  { slug: "infraestructura", name: "Infraestructura", emoji: "🏗️", description: "Salas, baños, bibliotecas y mantención del campus." },
  { slug: "deportes", name: "Deportes", emoji: "⚽", description: "Ligas internas, selecciones y torneos." },
  { slug: "cultura", name: "Cultura", emoji: "🎭", description: "Talleres, música y arte en la escuela." },
] as const;

const NEWS = [
  {
    topic: "academico",
    title: "Abren inscripciones a tutorías de Cálculo I",
    summary: "Las tutorías del CAi parten la segunda semana de clases. Cupos limitados.",
    body: "El equipo académico del CAi abrió las inscripciones para las tutorías gratuitas de Cálculo I. Serán los martes y jueves de 17:00 a 18:30 en la sala de estudio del piso 2. Inscríbete con tu correo UC; los cupos se asignan por orden de llegada.",
    daysAgo: 1,
  },
  {
    topic: "vida-universitaria",
    title: "Bienvenida novata 2026: programa completo",
    summary: "Tres días de actividades para conocer la escuela, el campus y a tu generación.",
    body: "La semana de bienvenida incluye recorrido por el campus, almuerzo por generación, feria de organizaciones y el tradicional carrete de bienvenida. Revisa el calendario para inscribirte en cada actividad.",
    daysAgo: 2,
  },
  {
    topic: "infraestructura",
    title: "Cierre temporal de la sala de estudio del piso 4",
    summary: "Por mantención del aire acondicionado, la sala estará cerrada hasta el viernes.",
    body: "La Dirección de Infraestructura informó que la sala de estudio del piso 4 permanecerá cerrada por trabajos de mantención. Como alternativa, se habilitó la sala B-12 con horario extendido hasta las 22:00.",
    daysAgo: 3,
  },
  {
    topic: "feminismo",
    title: "Taller: ¿cómo actuar ante una situación de acoso?",
    summary: "La vocalía de género invita a un taller práctico sobre protocolos y acompañamiento.",
    body: "El taller revisa el protocolo UC, cómo acompañar a una compañera o compañero y a quién acudir. Abierto a toda la comunidad, no requiere inscripción previa.",
    daysAgo: 4,
  },
  {
    topic: "rol-publico",
    title: "Voluntariado de invierno: postulaciones abiertas",
    summary: "Trabajos de invierno en la Región del Maule. Postula hasta fin de mes.",
    body: "Este año los trabajos de invierno se realizarán en comunas rurales de la Región del Maule. Se necesitan voluntarios para construcción, talleres con niños y logística. Las postulaciones cierran a fin de mes.",
    daysAgo: 5,
  },
  {
    topic: "deportes",
    title: "Parte la liga de fútbol interescuelas",
    summary: "Inscribe a tu equipo antes del viernes. Partidos los sábados en la mañana.",
    body: "La liga interescuelas tendrá ocho equipos. Cada equipo necesita mínimo 9 jugadores y un capitán responsable. Los partidos son los sábados entre 9:00 y 13:00 en las canchas del campus.",
    daysAgo: 6,
  },
  {
    topic: "cultura",
    title: "Convocatoria para la Noche de Talentos",
    summary: "Música, stand-up, baile o lo que quieras mostrar. Inscripciones hasta el 20.",
    body: "La Noche de Talentos vuelve con escenario abierto. Puedes presentarte solo o en grupo; cada número dura máximo 8 minutos. Habrá premios para las tres presentaciones más votadas por el público.",
    daysAgo: 7,
  },
  {
    topic: "academico",
    title: "Resultados de la encuesta de carga académica",
    summary: "Más de 1.200 respuestas. Revisa el resumen y las medidas que propondremos a la escuela.",
    body: "La encuesta mostró que el 62% de los estudiantes considera excesiva la carga en semanas de controles. El CAi presentará a la Dirección de Docencia una propuesta para coordinar fechas de evaluación entre cursos de un mismo semestre.",
    daysAgo: 9,
  },
];

async function main() {
  const topicIds = new Map<string, string>();
  for (const [index, topic] of TOPICS.entries()) {
    const row = await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: { name: topic.name, emoji: topic.emoji, description: topic.description, sortOrder: index },
      create: { ...topic, sortOrder: index },
    });
    topicIds.set(topic.slug, row.id);
  }

  for (const item of NEWS) {
    const topicId = topicIds.get(item.topic);
    if (!topicId) throw new Error(`Unknown topic ${item.topic}`);
    const publishedAt = new Date(Date.now() - item.daysAgo * 24 * 60 * 60 * 1000);
    const existing = await prisma.news.findFirst({ where: { title: item.title } });
    if (existing) {
      await prisma.news.update({
        where: { id: existing.id },
        data: { summary: item.summary, body: item.body, topicId },
      });
    } else {
      await prisma.news.create({
        data: { title: item.title, summary: item.summary, body: item.body, topicId, publishedAt },
      });
    }
  }

  console.log(`Seeded ${TOPICS.length} topics and ${NEWS.length} news items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
