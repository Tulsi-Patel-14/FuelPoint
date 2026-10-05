const fs = require('fs');
const path = 'D:\\Tulsi\\fuel\\backend\\src\\modules\\admin\\admin.controller.ts';
let content = fs.readFileSync(path, 'utf8');

// Update getWorkers
content = content.replace(
  /export const getWorkers = async \([\s\S]*?res\.status\(200\)\.json\(\{ success: true, data: workers \}\);\s+\} catch \(error\) \{\s+next\(error\);\s+\}\s+\};/m,
  `export const getWorkers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workers = await prisma.workerProfile.findMany({
      where: {
        isDeleted: false
      },
      include: { user: true, station: true }
    });
    res.status(200).json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
};`
);

// Update getWorkerById
content = content.replace(
  /export const getWorkerById = async \([\s\S]*?res\.status\(200\)\.json\(\{ success: true, data: worker \}\);\s+\} catch \(error\) \{\s+next\(error\);\s+\}\s+\};/m,
  `export const getWorkerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const worker = await prisma.workerProfile.findUnique({
      where: { id },
      include: { user: true, station: true }
    });

    if (!worker || worker.isDeleted) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.status(200).json({ success: true, data: worker });
  } catch (error) {
    next(error);
  }
};`
);

// Update deleteWorker
content = content.replace(
  /export const deleteWorker = async \([\s\S]*?res\.status\(200\)\.json\(\{ success: true, message: 'Worker deactivated successfully' \}\);\s+\} catch \(error\) \{\s+next\(error\);\s+\}\s+\};/m,
  `export const deleteWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id }
    });

    if (!workerProfile || workerProfile.isDeleted) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    await prisma.$transaction([
      prisma.workerProfile.update({
        where: { id },
        data: { isDeleted: true }
      }),
      prisma.user.update({
        where: { id: workerProfile.userId },
        data: { status: 'INACTIVE' }
      })
    ]);

    res.status(200).json({ success: true, message: 'Worker deleted successfully' });
  } catch (error) {
    next(error);
  }
};`
);

fs.writeFileSync(path, content);
console.log("Updated admin.controller.ts with isDeleted checks");
