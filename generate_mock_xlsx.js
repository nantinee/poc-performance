const XLSX = require("xlsx");
const fs = require("fs");


// Function to generate 1000 mock rows
function generateMockData() {
  const provinceZipMap = {
    "ตำบล/แขวง พระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร": "10200",
    "ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ เชียงใหม่": "50000",
    "ตำบลตลาดใหญ่ อำเภอเมืองภูเก็ต ภูเก็ต": "83000",
    "ตำบลในเมือง อำเภอเมืองขอนแก่น  ขอนแก่น": "40000",
    "ตำบลหนองปรือ อำเภอบางละมุง พัทยา ชลบุรี": "20150",
    "ตำบลปากน้ำ อำเภอเมืองสมุทรปราการ สมุทรปราการ": "10270",
    "ตำบลในเมือง อำเภอเมืองนครราชสีมา นครราชสีมา": "30000",
    "ตำบลบ้านสวน อำเภอเมืองชลบุรี ชลบุรี": "20000",
    "ตำบลหาดใหญ่ อำเภอหาดใหญ่ สงขลา": "90110",
    "ตำบลตลาด อำเภอเมืองสุราษฎร์ธานี สุราษฎร์ธานี": "84000",
    "ตำบลหมากแข้ง อำเภอเมืองอุดรธานี อุดรธานี": "41000"
  };
  const thaiProvinces = Object.keys(provinceZipMap);

  const data = [];
  for (let i = 1; i <= 1000; i++) {
    const provinceSender = thaiProvinces[Math.floor(Math.random() * thaiProvinces.length)];
    const provinceReceiver = thaiProvinces[Math.floor(Math.random() * thaiProvinces.length)];
    const zipSender = provinceZipMap[provinceSender];
    const zipReceiver = provinceZipMap[provinceReceiver];

    const note = Math.random() > 0.5 ? `Note ${i}` : "";
    data.push([
      `Sender ${i}`, 
      `0987${i.toString().padStart(6, "0")}`, 
      `Address ${i}, ${provinceSender}, Thailand`, 
      zipSender,
      `Receiver ${i}`, 
      `0812${i.toString().padStart(6, "0")}`, 
      `Address ${i}, ${provinceReceiver}, Thailand`, 
      zipReceiver,
      Math.floor(Math.random() * 5000) + 500, // น้ำหนัก (กรัม)
      note? "COD": "Non-COD", // ประเภทพัสดุ
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
   "น้ำหนัก (กรัม)", "ประเภทพัสดุ", "หมายเหตุ (ไม่บังคับ)", "มูลค่า COD", "ข้อมูลสินค้า COD : ประเภทสินค้า", "ข้อมูลสินค้า COD : ชนิดสินค้า", "ข้อมูลสินค้า COD : ขนาด", "ข้อมูลสินค้า COD : สี", "ข้อมูลสินค้า COD : จำนวน"]
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
