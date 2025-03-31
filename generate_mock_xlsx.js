const XLSX = require("xlsx");
const fs = require("fs");


// Function to generate 1000 mock rows
function generateMockData() {
  const thaiProvinces = [
    "Bangkok", "Chiang Mai", "Phuket", "Khon Kaen", "Pattaya", "Samut Prakan",
    "Nakhon Ratchasima", "Chonburi", "Hat Yai", "Surat Thani", "Udon Thani"
  ];

  const data = [];
  for (let i = 1; i <= 1000; i++) {
    const provinceSender = thaiProvinces[Math.floor(Math.random() * thaiProvinces.length)];
    const provinceReceiver = thaiProvinces[Math.floor(Math.random() * thaiProvinces.length)];

    const note = Math.random() > 0.5 ? `Note ${i}` : "";
    data.push([
      `Sender ${i}`, 
      `0987${i.toString().padStart(6, "0")}`, 
      `Address ${i}, ${provinceSender}, Thailand`, 
      `10${i % 90}`,
      `Receiver ${i}`, 
      `0812${i.toString().padStart(6, "0")}`, 
      `Address ${i}, ${provinceReceiver}, Thailand`, 
      `20${i % 90}`,
      Math.floor(Math.random() * 5000) + 500, // น้ำหนัก (กรัม)
      ["Document", "Electronics", "Clothing", "Food"][Math.floor(Math.random() * 4)], // ประเภทพัสดุ
      note, // หมายเหตุ (อาจไม่มี)
      note? (Math.random() * 5000).toFixed(2): '', // มูลค่า COD
      note? ["Gadget", "Accessory", "Clothes", "Food"][Math.floor(Math.random() * 4)] : '', // ประเภทสินค้า
      note? ["Phone", "Watch", "Shirt", "Snack"][Math.floor(Math.random() * 4)] : '', // ชนิดสินค้า
      note? ["Small", "Medium", "Large"][Math.floor(Math.random() * 3)] : '', // ขนาด
      note? ["Red", "Blue", "Black", "White"][Math.floor(Math.random() * 4)] : '', // สี
      note? Math.floor(Math.random() * 10) + 1 : '', // จำนวน
    ]);
  }
  return data;
}


// Header และ Merge Cells
const headers = [
  ["ข้อมูลผู้ส่ง", "", "", "", "ข้อมูลผู้รับ", "", "", "", "ข้อมูลพัสดุ", "", "", "ข้อมูล COD", "", "", "", "", "", ""],
  ["ชื่อผู้ส่ง", "เบอร์โทรผู้ส่ง", "ที่อยู่ผู้ส่ง", "รหัสไปรษณีย์", "ชื่อผู้รับ", "เบอร์โทรผู้รับ", "ที่อยู่ผู้รับ", "รหัสไปรษณีย์", 
   "น้ำหนัก (กรัม)", "ประเภทพัสดุ", "หมายเหตุ", "มูลค่า COD", "ประเภทสินค้า", "ชนิดสินค้า", "ขนาด", "สี", "จำนวน"]
];


// Generate Data
const mockData = generateMockData();

// สร้าง Worksheet
const ws = XLSX.utils.aoa_to_sheet([...headers, ...mockData]);

// กำหนด Merge Cells
ws["!merges"] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },  // ข้อมูลผู้ส่ง
  { s: { r: 0, c: 4 }, e: { r: 0, c: 7 } },  // ข้อมูลผู้รับ
  { s: { r: 0, c: 8 }, e: { r: 0, c: 10 } }, // ข้อมูลพัสดุ
  { s: { r: 0, c: 11 }, e: { r: 0, c: 16 } } // ข้อมูล COD
];

// สร้าง Workbook และบันทึกไฟล์
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Data");
XLSX.writeFile(wb, "mock_data.xlsx");

console.log(`✅ Mock Excel file created: mock_data.xlsx`);
