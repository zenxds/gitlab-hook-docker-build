"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const tar_1 = __importDefault(require("tar"));
async function unzip(src, dest) {
    fs_extra_1.default.ensureDirSync(dest);
    await tar_1.default.extract({
        file: src,
        cwd: dest
    });
}
exports.unzip = unzip;
