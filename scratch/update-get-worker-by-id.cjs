const fs = require('fs');
const path = 'D:\\Tulsi\\fuel\\backend\\src\\modules\\admin\\admin.controller.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export const getWorkerById = async \([\s\S]*?res\.status\(200\)\.json\(\{ success: true, data: worker \}\);\s+\} catch \(error\) \{\s+next\(error\);\s+\}\s+\};/m,
  `export const getWorkerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const worker = await prisma.workerProfile.findUnique({
      where: { id },
      include: { user: true, station: true }
    });

    if (!worker || worker.user.status === 'INACTIVE') {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.status(200).json({ success: true, data: worker });
  } catch (error) {
    next(error);
  }
};`
);

fs.writeFileSync(path, content);
console.log("Updated getWorkerById in admin.controller.ts");
