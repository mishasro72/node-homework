const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[0].model);
console.log("Total Memory:", os.totalmem());

// Path module

const filePath = path.join(__dirname, "sample-files", "demo.txt");
console.log("Joined path:", filePath);

// fs.promises API
async function run() {
  try {
    await fs.promises.writeFile(filePath, "Hello from fs.promises!", "utf8");
    const data = await fs.promises.readFile(filePath, "utf8");
    console.log("fs.promises read:", data);
  } catch (err) {
    console.error(err);
  }
}

run();

// Streams for large files- log first 40 chars of each chunk
const largeFilePath = path.join(__dirname, "sample-files", "largefile.txt");
fs.writeFileSync(largeFilePath, "", "utf8");
for (let i = 0; i < 100; i++) {
  fs.appendFileSync(
    largeFilePath,
    `Line ${i + 1}: This is a sample line for testing streams.\n`,
    "utf8",
  );
}

const readStream = fs.createReadStream(largeFilePath, {
  encoding: "utf8",
  highWaterMark: 1024,
});

readStream.on("data", (chunk) => {
  console.log("Read chunk:", chunk.substring(0, 40)); 
});

readStream.on("end", () => {
  console.log("Finished reading large file with streams.");
});

readStream.on("error", (err) => {
  console.log("Error reading large file:", err.message);
});
