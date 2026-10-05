const fs = require('fs');
const path = 'D:\\Tulsi\\fuel\\backend\\src\\modules\\admin\\admin.controller.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export const getWorkers = async \([\s\S]*?res\.status\(200\)\.json\(\{ success: true, data: workers \}\);\s+\} catch \(error\) \{\s+next\(error\);\s+\}\s+\};/m,
  `export const getWorkers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workers = await prisma.workerProfile.findMany({
      where: {
        user: {
          status: { not: 'INACTIVE' }
        }
      },
      include: { user: true, station: true }
    });
    res.status(200).json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
};`
);

fs.writeFileSync(path, content);
console.log("Updated getWorkers in admin.controller.ts");
