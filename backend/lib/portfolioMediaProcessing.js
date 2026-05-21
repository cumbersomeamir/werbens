import ffmpeg from "@ffmpeg-installer/ffmpeg";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const ffmpegPath = process.env.FFMPEG_PATH || ffmpeg.path || "ffmpeg";
const VIDEO_EXTENSIONS = new Set([".mp4", ".m4v", ".mov", ".webm"]);

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    process.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    process.on("error", reject);
    process.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
    });
  });
}

function getTempPath(originalPath, suffix) {
  const parsed = path.parse(originalPath);
  return path.join(os.tmpdir(), `${parsed.name}-${Date.now()}-${Math.random().toString(16).slice(2)}${suffix}`);
}

export function isProcessableVideo(fileName) {
  return VIDEO_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

export async function preparePortfolioUpload(filePath, fileName) {
  if (!isProcessableVideo(fileName)) {
    return {
      mediaPath: filePath,
      thumbnailPath: null,
      cleanupPaths: [],
    };
  }

  const extension = path.extname(fileName).toLowerCase();
  const optimizedPath = getTempPath(filePath, extension);
  const thumbnailPath = getTempPath(filePath, ".jpg");

  if (extension === ".webm") {
    await fs.promises.copyFile(filePath, optimizedPath);
  } else {
    await runFfmpeg([
      "-y",
      "-i",
      filePath,
      "-map",
      "0",
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      optimizedPath,
    ]);
  }

  await runFfmpeg([
    "-y",
    "-ss",
    "00:00:01",
    "-i",
    optimizedPath,
    "-frames:v",
    "1",
    "-vf",
    "scale='min(720,iw)':-2",
    "-q:v",
    "4",
    thumbnailPath,
  ]);

  return {
    mediaPath: optimizedPath,
    thumbnailPath,
    cleanupPaths: [optimizedPath, thumbnailPath],
  };
}
