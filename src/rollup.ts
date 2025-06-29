import { Bundle } from 'Bundle';
import fs from 'node:fs'
import { dirname } from 'node:path'

type Error = NodeJS.ErrnoException | null

export interface RollupOptions {
  input: string;
  output: string;
}

const existsSync = (dirname: string) => {
  return fs.existsSync(dirname)
}

const createDir = (path: string) => {
  return new Promise((resolve, reject) => {
    const lastPath = path.substring(0, path.lastIndexOf("/"));
    fs.mkdir(lastPath, { recursive: true }, (error) => {
      if (error) {
        reject({ success: false })
      } else {
        resolve({ success: true })
      }
    });
  })
}

const writeFile = (path: string, content: string, format: BufferEncoding = 'utf-8') => {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      path,
      content,
      {
        mode: 438, // 可读可写666，转化为十进制就是438
        flag: 'w+', // r+并不会清空再写入，w+会清空再写入
        encoding: format,
      },
      (err: Error) => {
        if (err) {
          reject({ success: false, data: err })
        } else {
          resolve({ success: true, data: { path, content } })
        }
      },
    )
  })
}

export function rollup(options: RollupOptions) {
  const { input = './index.js', output = './dist/index.js' } = options
  const bundle = new Bundle({
    entry: input
  });
  return bundle.build().then(() => {
    const generate = () => bundle.render()
    return {
      generate,
      write: async () => {
        const { code, map } = generate();
        if (!existsSync(dirname(output))) {
          await createDir(output)
        }
        return Promise.all([
          writeFile(output, code),
          writeFile(output + '.map', map.toString())
        ]);
      }
    };
  });
}

export * from './ast-parser/src/index';