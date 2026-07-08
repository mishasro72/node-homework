# Node.js Fundamentals

## What is Node.js?
Node.js is a runtime environment, which is used to run JS code outside the browser.

## How does Node.js differ from running JavaScript in the browser?
Runtime environment: JavaScript in the browser runs in a restricted environment that protects the user by preventing scripts from freely reading files or managing processes. Node.js lacks these restrictions, allowing JavaScript to interact with the operating system.

In the browser, objects such as `window`, `document`, and DOM elements are available.

In Node.js, APIs are available for interacting with the file system (the `fs` module), the network, environment variables, operating system processes, and system services.

Node.js has no concept of the DOM, as it does not render web pages.

Node.js can run on a computer or on a server, so it can do things browser JavaScript normally can't do: read and write files, start a web server, read environment variables, work with operating system services, use backend libraries.

## What is the V8 engine, and how does Node use it?
V8 is a high-performance JavaScript engine developed by Google for the Chrome browser. Its task is to read and interpret your code, converting it into instructions that a computer can execute.
When you run a JS file, Node.js feeds your code directly to the V8 engine, which compiles it straight into native machine code on the fly.

## What are some key use cases for Node.js?
Node is a popular choice for several kinds of projects:

Web APIs and servers.
Command-line tools (CLIs).
Real-time apps such as chat or live dashboards.
Build tools and scripts that bundle code or process files.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.
The main difference lies in the syntax for importing and exporting code.
CommonJS: The standard method for importing and exporting in Node.js.
Import: Uses `require()`.
Export: Uses `module.exports`.

ES Modules: The modern standard (more common in React).
Import: Uses `import`.
Export: Uses `export`.

**CommonJS (default in Node.js):**
```js
const fs = require("fs");
modul.exports = {  };
```

**ES Modules (supported in modern Node.js):**
```js
import { Link, useLocation } from "react-router-dom";
export default function Home() {
    pass
};
``` 