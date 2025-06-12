import { Module } from 'Module';
import { dirname, resolve } from 'path';
import fs from 'node:fs'
const flatted = require('flatted');
import { Statement } from 'Statement';
import { ModuleLoader } from 'ModuleLoader';
import { Bundle } from 'Bundle';
import { keys } from 'utils/obejct';

interface GraphOptions {
  entry: string;
  bundle: Bundle;
}

export class Graph {
  entryPath: string;
  basedir: string;
  statements: Statement[] = [];
  moduleLoader: ModuleLoader;
  modules: Module[] = [];
  moduleById: Record<string, Module> = {};
  resolveIds: Record<string, string> = {};
  orderedModules: Module[] = [];
  bundle: Bundle;
  constructor(options: GraphOptions) {
    const { entry, bundle } = options;
    this.entryPath = resolve(entry);
    this.basedir = dirname(this.entryPath);
    this.bundle = bundle;
    this.moduleLoader = new ModuleLoader(bundle);
  }

  async build() {
    // 1. 获取并解析模块信息
    const entryModule = await this.moduleLoader.fetchModule(
      this.entryPath,
      null,
      true
    );
    // 2. 构建依赖关系图
    this.modules.forEach((module) => module.bind());
    // 3. 模块拓扑排序
    this.orderedModules = this.sortModules(entryModule!);
    // 4. 标记需要包含的语句
    entryModule!.getExports().forEach((name) => {
      const declaration = entryModule!.traceExport(name);
      declaration!.use();
    });
    this.modules
    // this.modules.forEach(mod => {
  //     mod.statements.forEach(statement => {
  //       if (statement.node.type === 'ExportNamedDeclaration') {
  // console.log(statement.node?.declaration.declarations && statement.node?.declaration.declarations[0].id.name);
  //       }
  //     })
  //   })
    // console.log(entryModule!.getExports(), 'export')
    // 5. 处理命名冲突
    this.doconflict();
    function safeStringify(obj: any, indent = 2) {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    // 处理已遇到的对象（循环引用检测）
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular Reference]';
      seen.add(value);
    }
    
    // 特殊类型处理
    if (typeof value === 'bigint') return value.toString() + 'n'; // BigInt 类型
    if (value instanceof Error) return value.stack;              // 错误对象
    if (value instanceof Map) return Object.fromEntries(value); // Map 类型
    if (value instanceof Set) return [...value];                // Set 类型
    if (value instanceof Date) return value.toISOString();      // 日期对象
    
    return value;
  }, indent);
    }
    // this.modules.forEach(function (m, idx) {
    //     fs.writeFileSync('./output/' + idx + '.json', flatted.stringify(m.declarations))
    // })
  }

  doconflict() {
    const used: Record<string, true> = {};

    function getSafeName(name: string) {
      let safeName = name;
      let count = 1;
      while (used[safeName]) {
        safeName = `${name}$${count++}`;
      }
      used[safeName] = true;
      return safeName;
    }

    this.modules.forEach((module) => {
      keys(module.declarations).forEach((name) => {
        const declaration = module.declarations[name];
        declaration.name = getSafeName(declaration.name!);
      });
    });
  }

  getModuleById(id: string) {
    return this.moduleById[id];
  }

  addModule(module: Module) {
    if (!this.moduleById[module.id]) {
      this.moduleById[module.id] = module;
      this.modules.push(module);
    }
  }

  sortModules(entryModule: Module) {
    const orderedModules: Module[] = [];
    const analysedModule: Record<string, boolean> = {};
    const parent: Record<string, string> = {};
    const cyclePathList: string[][] = [];

    function getCyclePath(id: string, parentId: string): string[] {
      const paths = [id];
      let currrentId = parentId;
      while (currrentId !== id) {
        paths.push(currrentId);
        // 向前回溯
        currrentId = parent[currrentId];
      }
      paths.push(paths[0]);
      return paths.reverse();
    }

    function analyseModule(module: Module) {
      if (analysedModule[module.id]) {
        return;
      }
      for (const dependency of module.dependencyModules) {
        // 检测到循环依赖
        if (parent[dependency.id]) {
          if (!analysedModule[dependency.id]) {
            cyclePathList.push(getCyclePath(dependency.id, module.id));
          }
          continue;
        }
        parent[dependency.id] = module.id;
        analyseModule(dependency);
      }
      analysedModule[module.id] = true;
      orderedModules.push(module);
    }

    analyseModule(entryModule);
    if (cyclePathList.length) {
      cyclePathList.forEach((paths) => {
        console.log(paths);
      });
      process.exit(1);
    }
    return orderedModules;
  }
}
