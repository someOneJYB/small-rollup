"use strict";
exports.__esModule = true;
exports.Statement = void 0;
var Scope_1 = require("ast/Scope");
var isFunctionDeclaration_1 = require("utils/isFunctionDeclaration");
var buildScope_1 = require("utils/buildScope");
var findReference_1 = require("utils/findReference");
var Statement = /** @class */ (function () {
    function Statement(node, magicString, module) {
        this.isIncluded = false;
        this.defines = new Set();
        this.modifies = new Set();
        this.dependsOn = new Set();
        this.references = [];
        this.magicString = magicString;
        this.node = node;
        this.module = module;
        this.scope = new Scope_1.Scope({
            statement: this
        });
        this.start = node.start;
        this.next = 0;
        this.isImportDeclaration = isFunctionDeclaration_1.isImportDeclaration(node);
        this.isExportDeclaration = isFunctionDeclaration_1.isExportDeclaration(node);
        this.isReexportDeclaration = this.isExportDeclaration && !!node.source;
        this.isFunctionDeclaration = isFunctionDeclaration_1.isFunctionDeclaration(node);
    }
    Statement.prototype.analyse = function () {
        if (this.isImportDeclaration)
            return;
        // 1、构建作用域链，记录 Declaration 节点表
        buildScope_1.buildScope(this);
        // 2. 寻找引用依赖，记录 Reference 节点表
        findReference_1.findReference(this);
    };
    Statement.prototype.mark = function () {
        if (this.isIncluded) {
            return;
        }
        this.isIncluded = true;
        this.references.forEach(function (ref) { return ref.declaration && ref.declaration.use(); });
    };
    return Statement;
}());
exports.Statement = Statement;
