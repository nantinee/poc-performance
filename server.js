const express = require("express");
const fastify = require("fastify")();
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const now = require("performance-now");
const ExcelJS = require("exceljs");
const fs = require("fs");
const os = require("os");
const Redis = require("ioredis");
const { Queue, Worker } = require("bullmq");
const QueueBull = require("bull");
const Agenda = require("agenda");

const MONGO_URI = "mongodb://admin:secret@localhost:27017/mockdb?authSource=admin";
mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 })
  .then(() => {
    clearRedisData();
    console.log("✅ MongoDB Connected")
  })
  .catch((err) => console.error("❌ MongoDB Connection Error", err));

const TestModel = mongoose.model("Test", new mongoose.Schema({ data: Object }));

const agenda = new Agenda({
  db: {
    address: MONGO_URI,
    collection: "jobs",
  },
});
const redisClient = new Redis({
  host: "localhost",  // Redis server host
  port: 6379,         // Redis server port
});

// Define a job
agenda.define("process batch", async (job) => {
  const { batch } = job.attrs.data;
  console.log(`Processing batch: ${batch.length} items`);
  try {
    await TestModel.insertMany(batch);
  } catch (error) {
    console.error("❌ Error inserting batch:", error);
  }
});

// Start Agenda
(async function () {
  await agenda.start();
  console.log("🚀 Agenda started!");
})();
//---------------------------------------------------------------------
// ✅ Create Bull Queue
const insertQueue = new QueueBull("insertQueue", {
  redis: { host: "localhost", port: 6379 },
});

// ✅ Create BullMQ Queue (Separate Connection)
const insertQueueBullMq = new Queue("insertQueueBullMq", {
  connection: { host: "localhost", port: 6379 },
});
// BullMQ Worker: Process Jobs
const worker = new Worker(
  "insertQueueBullMq",
  async (job) => {
    console.log(`Processing BullMQ batch: ${job.id}, Size: ${job.data.batch.length}`);
    try {
      await TestModel.insertMany(job.data.batch);
      return { success: true };
    } catch (err) {
      console.error("❌ BullMQ Error:", err);
      throw err;
    }
  },
  { connection: { host: "localhost", port: 6379 } }
);
// ✅ Bull Queue Processor
insertQueue.process(async (job) => {
  console.log(`Processing Bull batch: ${job.id}, Size: ${job.data.batch.length}`);
  try {
    await TestModel.insertMany(job.data.batch);
    return { success: true };
  } catch (err) {
    console.error("❌ Bull Error:", err);
    throw err;
  }
});

// Function to clear all data from Redis
async function clearRedisData() {
  try {
    // Clear all keys from all Redis databases
    await redisClient.flushall(); // Or use flushdb() to clear the current database
    console.log("✅ Redis data cleared successfully");
  } catch (err) {
    console.error("❌ Error clearing Redis data:", err);
  }
}
// Optimized Function to Process Excel
// ------------------------------------------
// xlsx
async function processExcel(file) {
  const workbook = XLSX.readFile(file, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Convert sheet to JSON and skip the first row
  const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });

  return jsonData.slice(2); // 🔹 Skip first row
}
// exceljs
async function readExcelStreaming(filePath) {
  console.log('ExcelStreaming > ExcelJS');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(1);
  const data = [];

  // Get column headers from row 1 (skip row 1 and 2)
  const headers = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.text.trim();
  });

  // Start reading data from row 3, i.e., skip rows 1 and 2
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return; // Skip row 1 and row 2
    const rowData = {};
    row.eachCell((cell, colNumber) => {
      rowData[headers[colNumber]] = cell.value;
    });

    data.push(rowData);
  });

  return data;
}

// binary read (fs)
function readBinaryStream(filePath) {
  console.log("readBinaryStream > fs.");
  return new Promise((resolve, reject) => {
    let chunks = [];
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });
      jsonData = jsonData.slice(2); // remove header
      resolve(jsonData);
    });

    stream.on("error", (err) => reject(err));
  });
}

// ------------------------------------------

// Insert data in batches
async function insertDataInBatches(rows, batchSize) {
  const promises = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log('Use Promise.all---> ',i,' - ',i + batchSize);
    promises.push(TestModel.insertMany(batch));
  }
  await Promise.all(promises);
}
async function insertDataWithQueue(rows, batchSize = 100, concurrency = 5) {
  let index = 0;
  async function worker() {
    while (index < rows.length) {
      const start = index;
      index += batchSize;
      const batch = rows.slice(start, start + batchSize);
      console.log('-Promise.all Queue--->',start,' - ',start + batchSize);
      await TestModel.insertMany(batch);
    }
  }
  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);
}

// ✅ Function to Add Jobs to Bull
async function insertDataWithBull(rows, batchSize) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log("-Queue Bull --->", i, " - ", i + batchSize);
    await insertQueue.add({ batch });
  }
}

// ✅ Function to Add Jobs to BullMQ
async function insertDataWithBullMQ(rows, batchSize) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log("-Queue BullMQ --->", i, " - ", i + batchSize);
    await insertQueueBullMq.add("insertBatch", { batch });
  }
}
// ✅ Function to Add Jobs to Agenda
async function insertDataWithAgenda(rows, batchSize) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`-Queue Agenda MongoDB---> ${i} - ${i + batchSize}`);

    // Schedule the job immediately
    await agenda.now("process batch", { batch });
  }
}
// ------------------------------------------
// 📌 Express.js API
const app = express();
app.post("/test-express", async (req, res) => {
  const startTime = now();
  const start = process.hrtime(); // Start Timer
  try {
    // const rows = await processExcel("mock_data.xlsx");
    const rows = await readExcelStreaming("mock_data.xlsx");
    // const rows = await readBinaryStream("mock_data.xlsx");
    // await insertDataInBatches(rows, 500);
    // await insertDataWithQueue(rows, 1000);
    // await insertDataWithBull(rows, 100);
    await insertDataWithBullMQ(rows, 1000);
    // await insertDataWithAgenda(rows, 500);
    const endTime = now();
    const end = process.hrtime(start); // End Timer
    const latency = end[0] * 1000 + end[1] / 1e6; // Convert to ms
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    console.log(`🕒 Express Processing Time: ${(endTime - startTime).toFixed(2)} ms`);
    console.log(`[Express] Latency: ${latency.toFixed(2)}ms, RAM: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB, CPU: ${cpuUsage.user}`);
    res.send({ message: "✅ Express Test Completed", time: `${(endTime - startTime).toFixed(2)} ms` });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// 📌 Fastify API
fastify.post("/test-fastify", async (request, reply) => {
  const startTime = now();
  const start = process.hrtime(); // Start Timer
  try { 
    // const rows = await processExcel("mock_data.xlsx");
    const rows = await readExcelStreaming("mock_data.xlsx");
    // const rows = await readBinaryStream("mock_data.xlsx");
    // await insertDataInBatches(rows, 500);
    // await insertDataWithQueue(rows, 1000);
    // await insertDataWithBull(rows, 100);
    await insertDataWithBullMQ(rows, 1000); 
    // await insertDataWithAgenda(rows, 500);
    const endTime = now();
    const end = process.hrtime(start); // End Timer
    const latency = end[0] * 1000 + end[1] / 1e6; // Convert to ms
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    console.log(`🕒 Fastify Processing Time: ${(endTime - startTime).toFixed(2)} ms`);
    console.log(`[Fastify] Latency: ${latency.toFixed(2)}ms, RAM: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB, CPU: ${cpuUsage.user}`);
    reply.send({ message: "✅ Fastify Test Completed", time: `${(endTime - startTime).toFixed(2)} ms` });
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
});

// Start both servers
app.listen(8080, () => console.log("🚀 Express running on http://localhost:8080"));
fastify.listen({ port: 8081 }, () =>
  console.log("🚀 Fastify running on http://localhost:8081")
);
