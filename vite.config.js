import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 构建时把 JS / CSS 全部内联进 HTML，产出自包含的单文件 dist/index.html
export default defineConfig({
  plugins: [viteSingleFile()],
});
