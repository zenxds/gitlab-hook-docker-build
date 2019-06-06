"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
function randomStr(length) {
    let str = '';
    while (str.length < length) {
        str += Math.random()
            .toString(36)
            .slice(2);
    }
    return str.substr(0, length);
}
exports.randomStr = randomStr;
function isEmptyDir(dest) {
    return (!fs_1.default.existsSync(dest) ||
        (fs_1.default.statSync(dest).isDirectory() && !fs_1.default.readdirSync(dest).length));
}
exports.isEmptyDir = isEmptyDir;
__export(require("./retry"));
__export(require("./shell"));
__export(require("./unzip"));
