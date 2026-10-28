const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const rootDirectory = __dirname;
const port = 8080;
const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
};

const sendError = (response, statusCode, message) => {
    response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(message);
};

const server = http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.setHeader("Allow", "GET, HEAD");
        sendError(response, 405, "Method not allowed");
        return;
    }

    let requestPath;
    try {
        requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
        sendError(response, 400, "Invalid request path");
        return;
    }

    if (requestPath.includes("\0")) {
        sendError(response, 400, "Invalid request path");
        return;
    }

    const relativePath = requestPath === "/"
        ? "index.html"
        : requestPath.replace(/^[/\\]+/, "");
    const filePath = path.resolve(rootDirectory, relativePath);
    if (filePath !== rootDirectory && !filePath.startsWith(`${rootDirectory}${path.sep}`)) {
        sendError(response, 403, "Forbidden");
        return;
    }

    fs.stat(filePath, (error, stats) => {
        if (error) {
            sendError(response, error.code === "ENOENT" ? 404 : 500, "File not found");
            return;
        }
        if (!stats.isFile()) {
            sendError(response, 404, "File not found");
            return;
        }

        response.writeHead(200, {
            "Content-Length": stats.size,
            "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
        });
        if (request.method === "HEAD") {
            response.end();
            return;
        }

        const stream = fs.createReadStream(filePath);
        stream.on("error", (streamError) => {
            console.error(`Unable to read ${filePath}:`, streamError);
            response.destroy(streamError);
        });
        stream.pipe(response);
    });
});

console.log("Myweb server starting");
server.on("error", (error) => {
    console.error("Unable to start the Myweb server:", error);
    process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
    console.log(`Myweb is running at http://127.0.0.1:${port}`);
});
