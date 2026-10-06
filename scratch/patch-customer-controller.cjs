const fs = require('fs');
let content = fs.readFileSync('D:/Tulsi/fuel/backend/src/modules/admin/admin.controller.ts', 'utf8');

// Replace getCustomers
content = content.replace(
  /export const getCustomers = async.*?catch \(error\) \{\s*next\(error\);\s*\}/s,
  `export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search } = req.query;
      const whereClause: any = { isDeleted: false };
      if (search) {
        whereClause.fullName = { contains: search as string, mode: 'insensitive' };
      }
      const customers = await prisma.customerProfile.findMany({
        where: whereClause,
        include: { user: true, group: true }
      });
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }`
);

// Replace createCustomer
content = content.replace(
  /export const createCustomer = async.*?catch \(error\) \{ next\(error\); \}/s,
  `export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fullName, email, mobile, password, vehicle, groupId, address, status } = req.body;
      if (!fullName) return res.status(400).json({ success: false, message: 'Full name is required' });

      if (email || mobile) {
        const existing = await prisma.user.findFirst({
          where: { OR: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])] }
        });
        if (existing) {
          if (existing.email === email) return res.status(409).json({ success: false, message: 'Email is already in use.' });
          if (existing.mobile === mobile) return res.status(409).json({ success: false, message: 'Phone number is already in use.' });
        }
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
      const userStatus = status ? status.toUpperCase() : 'ACTIVE';

      const user = await prisma.user.create({
        data: {
          email, mobile, password: hashedPassword, role: 'CUSTOMER', status: userStatus as any,
          customerProfile: { create: { fullName, vehicle, groupId: groupId || undefined, address } }
        },
        include: { customerProfile: { include: { group: true, user: true } } }
      });
      
      const customerProfile = await prisma.customerProfile.findUnique({
        where: { userId: user.id },
        include: { user: true, group: true }
      });

      res.status(201).json({ success: true, data: customerProfile });
    } catch (error) { next(error); }
  }`
);

// Replace updateCustomer
content = content.replace(
  /export const updateCustomer = async.*?catch \(error\) \{ next\(error\); \}/s,
  `export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { fullName, email, mobile, password, vehicle, groupId, address, status } = req.body;

      const profile = await prisma.customerProfile.findUnique({ where: { id }, include: { user: true } });
      if (!profile) return res.status(404).json({ success: false, message: 'Customer not found' });

      if (email || mobile) {
        const existing = await prisma.user.findFirst({
          where: { 
            id: { not: profile.userId },
            OR: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])] 
          }
        });
        if (existing) {
          if (existing.email === email) return res.status(409).json({ success: false, message: 'Email is already in use.' });
          if (existing.mobile === mobile) return res.status(409).json({ success: false, message: 'Phone number is already in use.' });
        }
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
      const userStatus = status ? status.toUpperCase() : undefined;

      const updated = await prisma.customerProfile.update({
        where: { id },
        data: {
          fullName, vehicle, groupId: groupId || undefined, address,
          user: { update: { email, mobile, ...(hashedPassword && { password: hashedPassword }), ...(userStatus && { status: userStatus as any }) } }
        },
        include: { user: true, group: true }
      });
      res.status(200).json({ success: true, data: updated });
    } catch (error) { next(error); }
  }`
);

// Replace deleteCustomer
content = content.replace(
  /export const deleteCustomer = async.*?catch \(error\) \{ next\(error\); \}/s,
  `export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const profile = await prisma.customerProfile.findUnique({ where: { id } });
      if (!profile) return res.status(404).json({ success: false, message: 'Customer not found' });
      await prisma.$transaction([
        prisma.customerProfile.update({ where: { id }, data: { isDeleted: true } }),
        prisma.user.update({ where: { id: profile.userId }, data: { status: 'INACTIVE' } })
      ]);
      res.status(200).json({ success: true, message: 'Customer deleted' });
    } catch (error) { next(error); }
  }`
);

fs.writeFileSync('D:/Tulsi/fuel/backend/src/modules/admin/admin.controller.ts', content);
console.log('admin.controller.ts updated successfully.');
