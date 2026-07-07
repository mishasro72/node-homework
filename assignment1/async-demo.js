const fs = require("fs");
const path = require("path");
const util = require("util");

  const readFilePromis = util.promisify(fs.readFile);

// Write a sample file for demonstration
const samplePath = path.join(__dirname, "sample-files", "sample.txt");
fs.writeFileSync(samplePath, "Hello, async world!", "utf8");

// 1. Callback style
fs.readFile(samplePath, "utf8", (err, data) => {
  if (err) return console.error(err);
  console.log(`Callback read: ${data.trim()}`);
  readFileWithPromis()
    .then((data) => {
      console.log(`Promise read: ${data.trim()}`);
      return readFileWithAsync();
    })
    .catch((err) => {
      console.error(err);
    });
});

// Callback hell example (test and leave it in comments):
// Callback hell happens when you need to perform several asynchronous operations in sequence, and each one depends on the result of the previous one. Because callbacks are passed as arguments to be invoked later, chaining several of them together forces you to nest function after function. It is very hard to read, to debug, and awkward to add error handling.
// fs.readFile(samplePath, "utf8", (err, data) => {
//   if (err) return console.error(err);
//   fs.writeFile("./copy-sample.txt", data, "utf8", (err) => {
//     if (err) return console.error(err);
//     fs.appendFile("./copy-sample.txt", "some new information", (err) => {
//       if (err) console.log(err);
// ...more and more callbacks here
//       console.log("All done.");
//     });
//   });
// });

// 2. Promise style
function readFileWithPromis() {
  return new Promise((resolve, reject) => {
    fs.readFile(samplePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

// 3. Async/Await style
async function readFileWithAsync() {
  try {
    const data = await readFilePromis(samplePath, "utf8");
    console.log(`Async/Await read: ${data.trim()}`);
  } catch (err) {
    console.error(err);
  }
}
