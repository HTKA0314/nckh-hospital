const fs = require('fs');
const path = require('path');

const seedFile = path.join(__dirname, 'lib', 'mock-data', 'seed-data.ts');
let content = fs.readFileSync(seedFile, 'utf8');

const sampleBudgetDetails = `
      budgetDetails: [
        {
          id: 'bud-01',
          category: 'REMUNERATION',
          itemName: 'Thù lao chủ nhiệm đề tài và thư ký',
          unitPrice: 5000000,
          quantity: 2,
          totalAmount: 10000000,
          approvedAmount: 10000000
        },
        {
          id: 'bud-02',
          category: 'CONSUMABLES',
          itemName: 'Sinh phẩm hóa chất xét nghiệm Realtime-PCR',
          unitPrice: 500000,
          quantity: 200,
          totalAmount: 100000000,
          approvedAmount: 100000000
        },
        {
          id: 'bud-03',
          category: 'OTHER_SERVICES',
          itemName: 'In ấn biểu mẫu, bệnh án nghiên cứu',
          unitPrice: 100000,
          quantity: 100,
          totalAmount: 10000000,
          approvedAmount: 10000000
        }
      ],
      transactions: [
        {
          id: 'tx-01',
          projectId: 'proj-01',
          type: 'ADVANCE',
          category: 'CONSUMABLES',
          status: 'PAID',
          amount: 50000000,
          requestedBy: 'user-03',
          createdAt: '2026-05-15T08:00:00Z',
          updatedAt: '2026-05-18T10:00:00Z',
          approvedBy: 'user-05',
          attachmentUrls: [],
          rejectionReason: 'Xin rút ứng lần 1 để mua 50% hóa chất xét nghiệm'
        }
      ]
`;

content = content.replace(/budgetDetails:\s*\[\],\s*transactions:\s*\[\]/, sampleBudgetDetails.trim());

fs.writeFileSync(seedFile, content, 'utf8');
console.log('Added sample budget and transactions to seed data');
