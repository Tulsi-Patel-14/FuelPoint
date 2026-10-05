const { PrismaClient } = require('D:\\Tulsi\\fuel\\backend\\node_modules\\@prisma\\client');
const prisma = new PrismaClient();
async function run() {
  const workers = await prisma.workerProfile.findMany({ select: { shift: true } });
  console.log('Shifts:', [...new Set(workers.map(w => w.shift))]);
  prisma.$disconnect();
}
run();
