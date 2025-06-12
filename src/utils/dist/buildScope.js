"use strict";
exports.__esModule = true;
exports.buildScope = void 0;
var walk_1 = require("utils/walk");
var Scope_1 = require("ast/Scope");
var index_1 = require("../ast-parser/src/index");
;
function buildScope(statement) {
    var node = statement.node, initialScope = statement.scope;
    var scope = initialScope;
    walk_1.walk(node, {
        enter: function (node) {
            // function foo () {...}
            if (node.type === index_1.NodeType.FunctionDeclaration) {
                scope.addDeclaration(node, false);
            }
            // var let const
            if (node.type === index_1.NodeType.VariableDeclaration) {
                var currentNode = node;
                var isBlockDeclaration_1 = currentNode.kind !== 'var';
                currentNode.declarations.forEach(function (declarator) {
                    scope.addDeclaration(declarator, isBlockDeclaration_1);
                });
            }
            var newScope;
            // function scope
            if (node.type === index_1.NodeType.FunctionDeclaration) {
                var currentNode = node;
                newScope = new Scope_1.Scope({
                    parent: scope,
                    block: false,
                    paramNodes: currentNode.params,
                    statement: statement
                });
            }
            // new block state
            if (node.type === index_1.NodeType.BlockStatement) {
                newScope = new Scope_1.Scope({
                    parent: scope,
                    block: true,
                    statement: statement
                });
            }
            if (newScope) {
                Object.defineProperty(node, '_scope', {
                    value: newScope,
                    configurable: true
                });
                scope = newScope;
            }
        },
        leave: function (node) {
            // 当前 scope 即 node._scope
            if (node._scope && scope.parent) {
                scope = scope.parent;
            }
        }
    });
}
exports.buildScope = buildScope;
