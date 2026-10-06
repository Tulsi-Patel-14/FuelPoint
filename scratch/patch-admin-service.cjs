const fs = require('fs');
let code = fs.readFileSync('d:/Tulsi/fuel/FuelStationAdmin/src/services/adminService.ts', 'utf8');

const mapCustomerCode = `
const mapCustomer = (c: any): Customer => ({
  id: c.id,
  name: c.fullName || c.name || "Unknown",
  email: c.user?.email || c.email || "",
  phone: c.user?.mobile || c.phone || "",
  vehicle: c.vehicle || "",
  groupId: c.groupId || DEFAULT_GROUP_ID,
  registeredAt: c.joinedAt || new Date().toISOString(),
  status: (c.user?.status?.toLowerCase() || c.status || "active") as any,
  transactions: c.transactions || 0,
  totalSpend: c.totalSpend || 0,
  discountReceived: c.discountReceived || 0,
  lastActivity: c.lastActivity || null,
});
`;

code = code.replace(
  'const mapWorker = ',
  mapCustomerCode + '\nconst mapWorker = '
);

code = code.replace(
  /getCustomers: async \(\): Promise<Customer\[\]> => \{\s*const res = await fetchApi\('\/customers'\);\s*return Array\.isArray\(res\) \? res : \(res\?\.data \?\? \[\]\);\s*\}/,
  `getCustomers: async (): Promise<Customer[]> => {
    const res = await fetchApi('/customers');
    const raw = Array.isArray(res) ? res : (res?.data ?? []);
    return raw.map(mapCustomer);
  }`
);

code = code.replace(
  /createCustomer: async \(c: Partial<Customer>\): Promise<Customer> => fetchApi\('\/customers', \{ method: 'POST', body: JSON\.stringify\(c\) \}\),/,
  `createCustomer: async (c: Partial<Customer>): Promise<Customer> => {
    const payload = { ...c, fullName: c.name, mobile: c.phone };
    const raw = await fetchApi('/customers', { method: 'POST', body: JSON.stringify(payload) });
    return mapCustomer(raw);
  },`
);

code = code.replace(
  /updateCustomer: async \(id: string, c: Partial<Customer>\): Promise<Customer> => fetchApi\(`\/customers\/\$\{id\}`\, \{ method: 'PUT', body: JSON\.stringify\(c\) \}\),/,
  `updateCustomer: async (id: string, c: Partial<Customer>): Promise<Customer> => {
    const payload = { ...c, fullName: c.name, mobile: c.phone };
    const raw = await fetchApi(\`/customers/\${id}\`, { method: 'PUT', body: JSON.stringify(payload) });
    return mapCustomer(raw);
  },`
);

fs.writeFileSync('d:/Tulsi/fuel/FuelStationAdmin/src/services/adminService.ts', code);
console.log('adminService.ts updated.');
