import fs from "fs";
import path from "path";
import sharp from "sharp";

function compressImage(filePath) {
  const dirName = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const outputDir = path.join("src/assets/images/min", path.relative("src/assets/images", dirName));

  // 拡張子を取得
  function getExtension(file) {
    const ext = path.extname(file || "").split(".");
    return ext[ext.length - 1];
  }
  const fileFormat = getExtension(fileName);

  // もしディレクトリがなければ作成
  if (!fs.existsSync("src/assets/images/min")) {
    fs.mkdirSync("src/assets/images/min", { recursive: true });
  }
  // サブディレクトリがなければ作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (fileFormat === "jpg" || fileFormat === "jpeg" || fileFormat === "png") {
    sharp(filePath)
      .toFormat(fileFormat, { quality: 90 })
      .toFile(path.join(outputDir, fileName), (err, info) => {
        if (err) {
          console.error(`\u001b[1;31m ${fileName}の圧縮に失敗しました:`, err);
          return;
        }
        console.log(`\u001b[1;32m ${fileName}を圧縮しました。 ${info.size / 1000}KB`);
      });
  } else if (fileFormat === "svg") {
    // SVGファイルを圧縮せずにコピー
    fs.copyFile(filePath, path.join(outputDir, fileName), (err) => {
      if (err) {
        console.error(`\u001b[1;31m ${fileName}のコピーに失敗しました:`, err);
        return;
      }
      console.log(`\u001b[1;32m SVGファイルをコピーしました: ${fileName}`);
    });
  } else {
    console.log(`\u001b[1;31m 対応していないファイル形式です: ${fileName}`);
  }
}

// src/assets/images ディレクトリ内の全ての画像ファイルを処理
function processImagesInDirectory(directoryPath) {
  fs.readdirSync(directoryPath).forEach((file) => {
    const filePath = path.join(directoryPath, file);
    if (fs.statSync(filePath).isFile()) {
      compressImage(filePath);
    }
  });
}

// build スクリプトの実行
const imagesDirectory = "src/assets/images";
processImagesInDirectory(imagesDirectory);
