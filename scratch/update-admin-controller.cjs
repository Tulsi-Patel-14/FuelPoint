const fs = require('fs');
const path = 'D:\\Tulsi\\fuel\\backend\\src\\modules\\admin\\admin.controller.ts';
let content = fs.readFileSync(path, 'utf8');

// fix deleteWorker
content = content.replace(
  /export const deleteWorker = async \([\s\S]*?res\.status\(200\)\.json\(\{ success: true, message: 'Worker deleted successfully' \}\);\s+\} catch \(error\) \{\s+next\(error\);\s+\}\s+\};/m,
  `export const deleteWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id }
    });

    if (!workerProfile) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    await prisma.user.update({
      where: { id: workerProfile.userId },
      data: { status: 'INACTIVE' }
    });

    res.status(200).json({ success: true, message: 'Worker deactivated successfully' });
  } catch (error) {
    next(error);
  }
};`
);

// fix updateWorker
content = content.replace(
  /export const updateWorker = async \([\s\S]*?res\.status\(200\)\.json\(\{ success: true, data: updatedWorker \}\);\s+\} catch \(error\) \{\s+next\(error\);\s+\}\s+\};/m,
  `export const updateWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { fullName, email, mobile, password, shift, stationId, status } = req.body;

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!workerProfile) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    // Check for email or mobile uniqueness excluding current user
    if (email || mobile) {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: { not: workerProfile.userId },
          OR: [
            ...(email ? [{ email }] : []),
            ...(mobile ? [{ mobile }] : [])
          ]
        }
      });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email or mobile already in use by another user' });
      }
    }

    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedWorker = await prisma.workerProfile.update({
      where: { id },
      data: {
        fullName: fullName !== undefined ? fullName : undefined,
        shift: shift !== undefined ? shift : undefined,
        stationId: stationId !== undefined ? stationId : undefined,
        user: {
          update: {
            email: email !== undefined ? email : undefined,
            mobile: mobile !== undefined ? mobile : undefined,
            ...(hashedPassword && { password: hashedPassword }),
            ...(status && { status: status.toUpperCase() })
          }
        }
      },
      include: { user: true, station: true }
    });

    res.status(200).json({ success: true, data: updatedWorker });
  } catch (error) {
    console.error("Error in updateWorker:", error);
    next(error);
  }
};`
);

fs.writeFileSync(path, content);
console.log("Updated admin.controller.ts");
