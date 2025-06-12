"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Graph = void 0;
var path_1 = require("path");
var ModuleLoader_1 = require("ModuleLoader");
var obejct_1 = require("utils/obejct");
var Graph = /** @class */ (function () {
    function Graph(options) {
        this.statements = [];
        this.modules = [];
        this.moduleById = {};
        this.resolveIds = {};
        this.orderedModules = [];
        var entry = options.entry, bundle = options.bundle;
        this.entryPath = path_1.resolve(entry);
        this.basedir = path_1.dirname(this.entryPath);
        this.bundle = bundle;
        this.moduleLoader = new ModuleLoader_1.ModuleLoader(bundle);
    }
    Graph.prototype.build = function () {
        return __awaiter(this, void 0, void 0, function () {
            var entryModule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.moduleLoader.fetchModule(this.entryPath, null, true)];
                    case 1:
                        entryModule = _a.sent();
                        // 2. 构建依赖关系图
                        this.modules.forEach(function (module) { return module.bind(); });
                        // 3. 模块拓扑排序
                        this.orderedModules = this.sortModules(entryModule);
                        // 4. 标记需要包含的语句
                        entryModule.getExports().forEach(function (name) {
                            var declaration = entryModule.traceExport(name);
                            declaration.use();
                        });
                        console.log(entryModule.getExports(), 'export');
                        // 5. 处理命名冲突
                        this.doconflict();
                        return [2 /*return*/];
                }
            });
        });
    };
    Graph.prototype.doconflict = function () {
        var used = {};
        function getSafeName(name) {
            var safeName = name;
            var count = 1;
            while (used[safeName]) {
                safeName = name + "$" + count++;
            }
            used[safeName] = true;
            return safeName;
        }
        this.modules.forEach(function (module) {
            obejct_1.keys(module.declarations).forEach(function (name) {
                var declaration = module.declarations[name];
                declaration.name = getSafeName(declaration.name);
            });
        });
    };
    Graph.prototype.getModuleById = function (id) {
        return this.moduleById[id];
    };
    Graph.prototype.addModule = function (module) {
        if (!this.moduleById[module.id]) {
            this.moduleById[module.id] = module;
            this.modules.push(module);
        }
    };
    Graph.prototype.sortModules = function (entryModule) {
        var orderedModules = [];
        var analysedModule = {};
        var parent = {};
        var cyclePathList = [];
        function getCyclePath(id, parentId) {
            var paths = [id];
            var currrentId = parentId;
            while (currrentId !== id) {
                paths.push(currrentId);
                // 向前回溯
                currrentId = parent[currrentId];
            }
            paths.push(paths[0]);
            return paths.reverse();
        }
        function analyseModule(module) {
            if (analysedModule[module.id]) {
                return;
            }
            for (var _i = 0, _a = module.dependencyModules; _i < _a.length; _i++) {
                var dependency = _a[_i];
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
            cyclePathList.forEach(function (paths) {
                console.log(paths);
            });
            process.exit(1);
        }
        return orderedModules;
    };
    return Graph;
}());
exports.Graph = Graph;
