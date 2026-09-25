import re

with open('src/routes/_admin.reports.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Column and DataTable to imports
if 'from "@/components/admin/DataTable"' in content:
    content = re.sub(r'import { TablePagination } from "@/components/admin/DataTable";', 'import { Column, DataTable, TablePagination } from "@/components/admin/DataTable";', content)

# Remove manual pagination state
content = re.sub(r'  const \[customersPage, setCustomersPage\].*?\n', '', content)
content = re.sub(r'  const \[customersPageSize, setCustomersPageSize\].*?\n', '', content)
content = re.sub(r'  const \[transactionsPage, setTransactionsPage\].*?\n', '', content)
content = re.sub(r'  const \[transactionsPageSize, setTransactionsPageSize\].*?\n', '', content)

content = re.sub(r'  useEffect\(\(\) => {\n    setCustomersPage\(1\);\n  }, \[range, from, to, customersPageSize\]\);\n\n', '', content)
content = re.sub(r'  useEffect\(\(\) => {\n    setTransactionsPage\(1\);\n  }, \[range, from, to, transactionsPageSize\]\);\n\n', '', content)

# Remove manual slice logic
content = re.sub(r'  const totalTxnPages = [^\n]+\n', '', content)
content = re.sub(r'  const safeTxnPage = [^\n]+\n', '', content)
content = re.sub(r'  const pagedTxns = useMemo\([\s\S]*?\n  \);\n\n', '', content)

content = re.sub(r'  const totalRegPages = [^\n]+\n', '', content)
content = re.sub(r'  const safeRegPage = [^\n]+\n', '', content)
content = re.sub(r'  const pagedRegs = useMemo\([\s\S]*?\n  \);\n\n', '', content)


# Now, find the <div className="overflow-x-auto"> block and replace it
tables_replacement = """        <div className="mt-4">
          {category === "workers" && (
            <DataTable 
              rows={workers} 
              pageSize={10}
              emptyMessage="No workers found."
              columns={[
                { key: "name", header: "Worker", sortValue: w => w.name, render: w => <span className="font-medium">{w.name}</span> },
                { key: "status", header: "Status", sortValue: w => w.status, render: w => <StatusBadge status={w.status} /> },
                { key: "scans", header: "Scans", sortValue: w => w.scans, render: w => formatNumber(w.scans) },
                { key: "transactions", header: "Transactions", sortValue: w => w.transactions, render: w => formatNumber(w.transactions) },
                { key: "discount", header: "Discount processed", sortValue: w => w.discountProcessed, render: w => <span className="font-medium text-teal">{formatCurrency(w.discountProcessed)}</span> },
                { key: "lastActivity", header: "Last activity", sortValue: w => w.lastActivity, render: w => <span className="text-muted-foreground">{formatDate(w.lastActivity)}</span> },
              ]} 
            />
          )}

          {category === "groups" && (
            <DataTable 
              rows={dist} 
              pageSize={10}
              emptyMessage="No groups found."
              columns={[
                { key: "name", header: "Group", sortValue: g => g.name, render: g => <span className="font-medium">{g.name}</span> },
                { key: "discount", header: "Discount %", sortValue: g => g.discountPercent, render: g => `${g.discountPercent}%` },
                { key: "customers", header: "Customers", sortValue: g => g.customers, render: g => formatNumber(g.customers) },
                { key: "transactions", header: "Transactions", sortValue: g => g.transactions, render: g => formatNumber(g.transactions) },
                { key: "discountGenerated", header: "Discount generated", sortValue: g => g.discountGenerated, render: g => <span className="font-medium text-teal">{formatCurrency(g.discountGenerated)}</span> },
              ]}
            />
          )}

          {category === "customers" && (
            <DataTable 
              rows={regs} 
              pageSize={10}
              emptyMessage="No registrations in this range."
              columns={[
                { key: "name", header: "Customer", sortValue: c => c.name, render: c => <span className="font-medium">{c.name}</span> },
                { key: "registered", header: "Registered", sortValue: c => c.registeredAt, render: c => <span className="text-muted-foreground">{formatDate(c.registeredAt)}</span> },
                { key: "group", header: "Group", sortValue: c => groups.find((g) => g.id === c.groupId)?.name ?? "", render: c => groups.find((g) => g.id === c.groupId)?.name },
                { key: "transactions", header: "Transactions", sortValue: c => c.transactions, render: c => formatNumber(c.transactions) },
                { key: "discount", header: "Discount received", sortValue: c => c.discountReceived, render: c => <span className="font-medium text-teal">{formatCurrency(c.discountReceived)}</span> },
                { key: "status", header: "Status", sortValue: c => c.status, render: c => <StatusBadge status={c.status} /> },
              ]}
            />
          )}

          {(category === "transactions" || category === "discount") && (
            <DataTable 
              rows={txns} 
              pageSize={10}
              emptyMessage="No transactions in this range."
              columns={[
                { key: "id", header: "Txn", sortValue: t => t.id, render: t => <span className="font-mono text-xs text-muted-foreground">{t.id}</span> },
                { key: "date", header: "Date", sortValue: t => t.createdAt, render: t => <span className="text-muted-foreground">{formatDateTime(t.createdAt)}</span> },
                { key: "customer", header: "Customer", sortValue: t => t.customerName, render: t => <span className="font-medium">{t.customerName}</span> },
                { key: "worker", header: "Worker", sortValue: t => t.workerName, render: t => t.workerName },
                { key: "fuel", header: "Fuel", sortValue: t => t.litres, render: t => <span className="text-muted-foreground">{t.fuel} • {t.litres} L</span> },
                { key: "amount", header: "Amount", sortValue: t => t.amount, render: t => <span className="font-medium">{formatCurrency(t.amount)}</span> },
                { key: "discount", header: "Discount", sortValue: t => t.discountAmount, render: t => <span className="font-medium text-teal">-{formatCurrency(t.discountAmount)} ({t.discountPercent}%)</span> },
              ]}
            />
          )}
        </div>"""

content = re.sub(r'        <div className="overflow-x-auto">[\s\S]*?        </div>\n      </Panel>', tables_replacement + '\n      </Panel>', content)

with open('src/routes/_admin.reports.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated reports page")
