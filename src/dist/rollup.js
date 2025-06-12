"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
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
exports.rollup = void 0;
var Bundle_1 = require("Bundle");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var existsSync = function (dirname) {
    return node_fs_1["default"].existsSync(dirname);
};
var createDir = function (path) {
    return new Promise(function (resolve, reject) {
        var lastPath = path.substring(0, path.lastIndexOf("/"));
        node_fs_1["default"].mkdir(lastPath, { recursive: true }, function (error) {
            if (error) {
                reject({ success: false });
            }
            else {
                resolve({ success: true });
            }
        });
    });
};
var writeFile = function (path, content, format) {
    if (format === void 0) { format = 'utf-8'; }
    return new Promise(function (resolve, reject) {
        node_fs_1["default"].writeFile(path, content, {
            mode: 438,
            flag: 'w+',
            encoding: format
        }, function (err) {
            if (err) {
                reject({ success: false, data: err });
            }
            else {
                resolve({ success: true, data: { path: path, content: content } });
            }
        });
    });
};
function rollup(options) {
    var _this = this;
    var _a = options.input, input = _a === void 0 ? './index.js' : _a, _b = options.output, output = _b === void 0 ? './dist/index.js' : _b;
    var bundle = new Bundle_1.Bundle({
        entry: input
    });
    return bundle.build().then(function () {
        var generate = function () { return bundle.render(); };
        return {
            generate: generate,
            write: function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, code, map;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = generate(), code = _a.code, map = _a.map;
                            if (!!existsSync(node_path_1.dirname(output))) return [3 /*break*/, 2];
                            return [4 /*yield*/, createDir(output)];
                        case 1:
                            _b.sent();
                            _b.label = 2;
                        case 2: return [2 /*return*/, Promise.all([
                                writeFile(output, code),
                                writeFile(output + '.map', map.toString())
                            ])];
                    }
                });
            }); }
        };
    });
}
exports.rollup = rollup;
__exportStar(require("./ast-parser/src/index"), exports);
