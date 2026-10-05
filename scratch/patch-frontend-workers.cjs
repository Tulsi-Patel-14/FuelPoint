const fs = require('fs');
let code = fs.readFileSync('d:/Tulsi/fuel/FuelStationAdmin/src/routes/_admin.workers.tsx', 'utf8');

code = code.replace(
  '  const filtered = useMemo(',
  `  const augmentedWorkers = useMemo(() => {
    return workers.map((w) => {
      const wTxns = transactions.filter(t => t.workerId === w.id);
      const discount = wTxns.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
      const customers = new Set(wTxns.map(t => t.customerId)).size;
      
      let lastAct = w.lastActivity;
      if (wTxns.length > 0) {
        const sorted = [...wTxns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        lastAct = sorted[0].createdAt;
      }

      return {
        ...w,
        transactions: wTxns.length,
        discountProcessed: discount,
        customersScanned: customers,
        lastActivity: lastAct
      };
    });
  }, [workers, transactions]);

  const filtered = useMemo(`
);

code = code.replace(/workers\.filter\(\s*\(\s*w\s*\)/g, 'augmentedWorkers.filter((w)');
code = code.replace(/workers\.reduce/g, 'augmentedWorkers.reduce');
code = code.replace(/workers\.length/g, 'augmentedWorkers.length');

// Note: Ensure we don't accidentally replace `setWorkers` or similar. The above regexes are precise enough for the totals and filtering.

fs.writeFileSync('d:/Tulsi/fuel/FuelStationAdmin/src/routes/_admin.workers.tsx', code);
console.log('Frontend script updated successfully.');
