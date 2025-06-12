"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.Module = void 0;
var magic_string_1 = require("magic-string");
var index_1 = require("./ast-parser/src/index");
var Statement_1 = require("Statement");
var Declaration_1 = require("./ast/Declaration");
var obejct_1 = require("./utils/obejct");
var Module = /** @class */ (function () {
    function Module(_a) {
        var _this = this;
        var path = _a.path, bundle = _a.bundle, code = _a.code, loader = _a.loader, _b = _a.isEntry, isEntry = _b === void 0 ? false : _b;
        this.isEntry = false;
        this.exportAllSources = [];
        this.exportAllModules = [];
        this.dependencies = [];
        this.dependencyModules = [];
        this.referencedModules = [];
        this.id = path;
        this.bundle = bundle;
        this.moduleLoader = loader;
        this.isEntry = isEntry;
        this.path = path;
        this.code = code;
        this.magicString = new magic_string_1["default"](code);
        this.imports = {};
        this.exports = {};
        this.reexports = {};
        this.declarations = {};
        try {
            var ast = index_1.parse(code);
            var nodes = ast.body;
            this.statements = nodes.map(function (node) {
                var magicString = _this.magicString.snip(node.start, node.end);
                return new Statement_1.Statement(node, magicString, _this);
            });
        }
        catch (e) {
            console.log(e);
            throw e;
        }
        this.analyseAST();
    }
    Module.prototype.analyseAST = function () {
        var _this = this;
        this.statements.forEach(function (statement) {
            statement.analyse();
            if (statement.isImportDeclaration) {
                _this.addImports(statement);
            }
            else if (statement.isExportDeclaration) {
                _this.addExports(statement);
            }
            // 注册顶层声明
            if (!statement.scope.parent) {
                statement.scope.eachDeclaration(function (name, declaration) {
                    _this.declarations[name] = declaration;
                });
            }
        });
        var statements = this.statements;
        var next = this.code.length;
        for (var i = statements.length - 1; i >= 0; i--) {
            statements[i].next = next;
            next = statements[i].start;
        }
        console.log('module:', this.path);
        console.log('declaration', this.declarations);
        this.statements.forEach(function (statement) {
            statement.references.forEach(function (reference) {
                // 根据引用寻找声明的位置
                // 寻找顺序: 1. statement 2. 当前模块 3. 依赖模块
                console.log('reference', reference.name);
            });
        });
    };
    Module.prototype.addDependencies = function (source) {
        if (!this.dependencies.includes(source)) {
            this.dependencies.push(source);
        }
    };
    Module.prototype.addImports = function (statement) {
        var _this = this;
        var node = statement.node;
        var source = node.source.value;
        // import
        node.specifiers.forEach(function (specifier) {
            var isDefault = specifier.type === 'ImportDefaultSpecifier';
            var isNamespace = specifier.type === 'ImportNamespaceSpecifier';
            var localName = specifier.local.name;
            var name = isDefault
                ? 'default'
                : isNamespace
                    ? '*'
                    : specifier.imported.name;
            _this.imports[localName] = { source: source, name: name, localName: localName };
        });
        this.addDependencies(source);
    };
    Module.prototype.addExports = function (statement) {
        var _this = this;
        var node = statement.node;
        var source = node.source && node.source.value;
        if (node.type === 'ExportNamedDeclaration') {
            // export { a, b } from 'mod'
            if (node.specifiers.length) {
                node.specifiers.forEach(function (specifier) {
                    var localName = specifier.local.name;
                    var exportedName = specifier.exported.name;
                    _this.exports[exportedName] = {
                        localName: localName,
                        name: exportedName
                    };
                    if (source) {
                        _this.reexports[localName] = {
                            statement: statement,
                            source: source,
                            localName: localName,
                            name: localName,
                            module: undefined
                        };
                        _this.imports[localName] = {
                            source: source,
                            localName: localName,
                            name: localName
                        };
                        _this.addDependencies(source);
                    }
                });
            }
            else {
                var declaration = node.declaration;
                var name = void 0;
                if (declaration.type === 'VariableDeclaration') {
                    // export const foo = 2;
                    name = declaration.declarations[0].id.name;
                }
                else {
                    // export function foo() {}
                    name = declaration.id.name;
                }
                this.exports[name] = {
                    statement: statement,
                    localName: name,
                    name: name
                };
            }
        }
        else if (node.type === 'ExportDefaultDeclaration') {
            var identifier = 
            // export default foo;
            (node.declaration.id && node.declaration.id.name) ||
                // export defualt function foo(){}
                node.declaration.name;
            this.exports['default'] = {
                statement: statement,
                localName: identifier,
                name: 'default'
            };
            this.declarations['default'] = new Declaration_1.SyntheticDefaultDeclaration(node, identifier, statement);
        }
        else if (node.type === 'ExportAllDeclaration') {
            // export * from 'mod'
            if (source) {
                this.exportAllSources.push(source);
                this.addDependencies(source);
            }
        }
    };
    Module.prototype.bind = function () {
        this.bindImportSpecifiers();
        this.bindReferences();
    };
    Module.prototype.bindImportSpecifiers = function () {
        var _this = this;
        __spreadArrays(Object.values(this.imports), Object.values(this.reexports)).forEach(function (specifier) {
            specifier.module = _this._getModuleBySource(specifier.source);
        });
        this.exportAllModules = this.exportAllSources.map(this._getModuleBySource.bind(this));
        // 建立模块依赖图
        this.dependencyModules = this.dependencies.map(this._getModuleBySource.bind(this));
        this.dependencyModules.forEach(function (module) {
            module.referencedModules.push(_this);
        });
    };
    Module.prototype.bindReferences = function () {
        var _this = this;
        // 处理 default 导出
        if (this.declarations['default'] && this.exports['default'].localName) {
            var declaration = this.trace(this.exports['default'].localName);
            if (declaration) {
                this.declarations['default'].bind(declaration);
            }
        }
        this.statements.forEach(function (statement) {
            statement.references.forEach(function (reference) {
                // 根据引用寻找声明的位置
                // 寻找顺序: 1. statement 2. 当前模块 3. 依赖模块
                var declaration = reference.scope.findDeclaration(reference.name) ||
                    _this.trace(reference.name);
                if (declaration) {
                    declaration.addReference(reference);
                }
            });
        });
    };
    Module.prototype.getOrCreateNamespace = function () {
        if (!this.declarations['*']) {
            this.declarations['*'] = new Declaration_1.SyntheticNamespaceDeclaration(this);
        }
        return this.declarations['*'];
    };
    Module.prototype.trace = function (name) {
        if (this.declarations[name]) {
            // 从当前模块找
            console.log('************************************');
            console.log(this.declarations[name]);
            console.log('************************************');
            console.log(name);
            console.log('************************************');
            return this.declarations[name];
        }
        if (this.imports[name]) {
            var importSpecifier = this.imports[name];
            var importModule = importSpecifier.module;
            if (importSpecifier.name === '*') {
                return importModule.getOrCreateNamespace();
            }
            // 从依赖模块找
            var declaration = importModule.traceExport(importSpecifier.name);
            if (declaration) {
                return declaration;
            }
        }
        return null;
    };
    Module.prototype.traceExport = function (name) {
        // 1. reexport
        // export { foo as bar } from './mod'
        var reexportDeclaration = this.reexports[name];
        if (reexportDeclaration) {
            // 说明是从其它模块 reexport 出来的
            // 经过 bindImportSpecifier 方法处理，现已绑定 module
            var declaration = reexportDeclaration.module.traceExport(reexportDeclaration.localName);
            if (!declaration) {
                throw new Error(reexportDeclaration.localName + " is not exported by module " + reexportDeclaration.module.path + "(imported by " + this.path + ")");
            }
            return declaration;
        }
        // 2. export
        // export { foo }
        var exportDeclaration = this.exports[name];
        if (exportDeclaration) {
            var declaration = this.trace(name);
            if (declaration) {
                return declaration;
            }
        }
        // 3. export all
        for (var _i = 0, _a = this.exportAllModules; _i < _a.length; _i++) {
            var exportAllModule = _a[_i];
            var declaration = exportAllModule.trace(name);
            if (declaration) {
                return declaration;
            }
        }
        return null;
    };
    // 在 render 的地方判断没有被
    Module.prototype.render = function () {
        var _this = this;
        var source = this.magicString.clone().trim();
        this.statements.forEach(function (statement) {
            // 1. Tree Shaking
            if (!statement.isIncluded) {
                source.remove(statement.start, statement.next);
                return;
            }
            // 2. 重写引用位置的变量名 -> 对应的声明位置的变量名
            statement.references.forEach(function (reference) {
                var start = reference.start, end = reference.end;
                var declaration = reference.declaration;
                if (declaration) {
                    var name = declaration.render();
                    source.overwrite(start, end, name);
                }
            });
            // 3. 擦除/重写 export 相关的代码
            if (statement.isExportDeclaration && !_this.isEntry) {
                // export { foo, bar }
                if (statement.node.type === 'ExportNamedDeclaration' &&
                    statement.node.specifiers.length) {
                    source.remove(statement.start, statement.next);
                }
                // remove `export` from `export const foo = 42`
                else if (statement.node.type === 'ExportNamedDeclaration' &&
                    (statement.node.declaration.type === 'VariableDeclaration' ||
                        statement.node.declaration.type === 'FunctionDeclaration')) {
                    source.remove(statement.node.start, statement.node.declaration.start);
                }
                // remove `export * from './mod'`
                else if (statement.node.type === 'ExportAllDeclaration') {
                    source.remove(statement.start, statement.next);
                }
                // export default
                else if (statement.node.type === 'ExportDefaultDeclaration') {
                    var defaultDeclaration = _this.declarations['default'];
                    var defaultName = defaultDeclaration.render();
                    // export default function() {}  -> function a() {}
                    if (statement.node.declaration.type === 'FunctionDeclaration') {
                        if (statement.node.declaration.id) {
                            // export default function foo() {} -> const a = funciton foo() {}
                            source.overwrite(statement.node.start, statement.node.declaration.start, "const " + defaultName + " = ");
                        }
                        else {
                            source.overwrite(statement.node.start, statement.node.declaration.start + 8, "function " + defaultName);
                        }
                    }
                    else {
                        // export default () => {}
                        // export default Foo;
                        source.overwrite(statement.node.start, statement.node.declaration.start, "const " + defaultName + " = ");
                    }
                }
            }
        });
        // 4. 单独处理 namespace 导出
        if (this.declarations['*']) {
            var namespaceDeclaration = this.declarations['*'];
            if (namespaceDeclaration.needsNamespaceBlock) {
                source.append("\n\n" + namespaceDeclaration.renderBlock() + "\n");
            }
        }
        return source.trim();
    };
    Module.prototype.getExports = function () {
        return __spreadArrays(obejct_1.keys(this.exports), obejct_1.keys(this.reexports), this.exportAllModules
            .map(function (module) {
            return module.getExports().filter(function (name) { return name !== 'default'; });
        })
            .flat());
    };
    Module.prototype._getModuleBySource = function (source) {
        var id = this.moduleLoader.resolveId(source, this.path);
        return this.bundle.getModuleById(id);
    };
    return Module;
}());
exports.Module = Module;
