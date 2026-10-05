const fs = require('fs');
let schema = fs.readFileSync('D:\\Tulsi\\fuel\\backend\\prisma\\schema.prisma', 'utf8');

schema = schema.replace(/enum AccountStatus \{[\s\S]*?\}/, `enum AccountStatus {
  PENDING
  ACTIVE
  SUSPENDED
  INACTIVE
  OFFLINE
}`);

schema = schema.replace(/model WorkerProfile \{[\s\S]*?transactions Transaction\[\]\n\}/, `model WorkerProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  fullName  String
  shift     String?
  stationId String?
  station   Station? @relation(fields: [stationId], references: [id])
  joinedAt  DateTime @default(now())
  scans     Int      @default(0)
  isDeleted Boolean  @default(false)

  transactions Transaction[]
}`);

fs.writeFileSync('D:\\Tulsi\\fuel\\backend\\prisma\\schema.prisma', schema);
console.log('Schema updated');
