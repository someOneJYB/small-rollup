"use strict";
exports.__esModule = true;
exports.isImportDeclaration = exports.isExportDeclaration = exports.isFunctionDeclaration = void 0;
var index_1 = require("../ast-parser/src/index");
function isFunctionDeclaration(node) {
    if (!node)
        return false;
    return (
    // function foo() {}
    node.type === 'FunctionDeclaration' ||
        // const foo = function() {}
        (node.type === index_1.NodeType.VariableDeclarator &&
            node.init &&
            node.init.type === index_1.NodeType.FunctionExpression) ||
        // export function ...
        // export default function
        ((node.type === index_1.NodeType.ExportNamedDeclaration ||
            node.type === index_1.NodeType.ExportDefaultDeclaration) &&
            !!node.declaration &&
            node.declaration.type === index_1.NodeType.FunctionDeclaration));
}
exports.isFunctionDeclaration = isFunctionDeclaration;
function isExportDeclaration(node) {
    return /^Export/.test(node.type);
}
exports.isExportDeclaration = isExportDeclaration;
function isImportDeclaration(node) {
    return node.type === 'ImportDeclaration';
}
exports.isImportDeclaration = isImportDeclaration;
