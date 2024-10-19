import { defineConfig } from 'vite';
import path from 'path';
import globule from 'globule';
import vitePluginPugStatic from '@macropygia/vite-plugin-pug-static';
import { terser } from 'rollup-plugin-terser';

// 入力ファイルを保持するオブジェクト
const inputs = {};

// ファイルの取得と出力名の設定を行う関数
const addFilesToInputs = (files, extension, logPrefix, outputExtension) => {
  files.forEach((file) => {
    const relativePath = path.relative(path.resolve(__dirname, '../src'), file);
    const outputName = relativePath.replace(new RegExp(`\\.${extension}$`), outputExtension);
    inputs[outputName] = file;
    console.log(`${logPrefix} found: ${relativePath}`); // ログ出力
  });
};

// ファイル取得関数
const getFiles = (patterns, ignorePatterns) => globule.find(patterns, { ignore: ignorePatterns });

// ファイルの取得
const pugFiles = getFiles([path.resolve(__dirname, '../src/**/*.pug')], [path.resolve(__dirname, '../src/**/_*.pug')]);
const scssFiles = getFiles([path.resolve(__dirname, '../src/**/*.scss')], [path.resolve(__dirname, '../src/**/_*.scss')]);
const jsFiles = getFiles([path.resolve(__dirname, '../src/**/index.js')], [path.resolve(__dirname, '../src/**/_*.js')]);
const imageFiles = getFiles([path.resolve(__dirname, '../src/**/*.{gif,jpeg,jpg,png,svg,webp}')], [path.resolve(__dirname, '../src/**/_*.*')]);

// 各ファイルタイプを入力に追加
addFilesToInputs(pugFiles, 'pug', 'Pug file', 'html');
addFilesToInputs(scssFiles, 'scss', 'SCSS file', 'css');
addFilesToInputs(jsFiles, 'js', 'JS file', 'js');

// 画像ファイルの処理
imageFiles.forEach((imageFile) => {
  const relativePath = path.relative(path.resolve(__dirname, '../src'), imageFile);
  inputs[`assets/images/${relativePath}`] = imageFile;
  console.log(`Image file found: ${relativePath}`);
});

// 出力オプション設定
const outputOptions = {
  entryFileNames: (chunkInfo) => {
    const moduleId = chunkInfo.facadeModuleId;
    if (!moduleId) {
      return 'assets/js/[name].js';  // デフォルトファイル名
    }
    const name = path.relative(path.resolve(__dirname, '../src'), moduleId);
    const dirName = path.dirname(name);
    const fileName = path.basename(name, path.extname(name));
    return `assets/js/${dirName.replace(/\\/g, '/').replace(/^assets\/js\//, '')}/${fileName}.js`; // 正しいJS出力パス
  },
  chunkFileNames: (chunkInfo) => {
    const moduleId = chunkInfo.facadeModuleId || '';
    const relativePath = path.relative(path.resolve(__dirname, '../src'), moduleId);
    const dirName = path.dirname(relativePath);
    const fileName = path.basename(relativePath, path.extname(relativePath));
    return `assets/js/${dirName.replace(/\\/g, '/')}/${fileName}.js`; // 正しいチャンクファイル出力
  },
  assetFileNames: (assetInfo) => {
    const ext = path.extname(assetInfo.name).toLowerCase();
    const fileName = path.basename(assetInfo.name);

    // 画像ファイルの処理
    if (/\.(gif|jpeg|jpg|png|svg|webp)$/.test(ext)) {
      const dirName = path.dirname(assetInfo.originalFileName).replace(/\\/g, '/');
      return `assets/images/${dirName.replace(/^assets\/images\//, '')}/${fileName}`;
    }

    // CSSファイルの処理
    if (ext === '.css') {
      const dirName = path.dirname(assetInfo.name).replace(/\\/g, '/');
      return `assets/css/${dirName.replace(/^assets\/css\//, '')}/index.css`;
    }
    // その他アセット
    return `assets/[name][extname]`; // その他アセットの出力
  }
};

// Vite設定
export default defineConfig({
  root: path.resolve(__dirname, '../src'),
  base: './',
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      format: {
        comments: true,
      },
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      input: inputs, // Pug, SCSS, JS からのエントリーポイント
      output: outputOptions, // 出力オプション
      plugins: [terser()],
    },
    polyfillModulePreload: false,
  },
  plugins: [
    vitePluginPugStatic({
      buildOptions: { basedir: path.resolve(__dirname, '../src') },
      serveOptions: { basedir: path.resolve(__dirname, '../src') },
    }),
  ],
  server: {
    open: true,
    host: true,
    port: 3000,
  },
});
