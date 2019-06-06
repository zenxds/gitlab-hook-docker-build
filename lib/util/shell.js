"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const fs_extra_1 = __importDefault(require("fs-extra"));
function exec(cmd, options) {
    const execOptions = Object.assign({
        timeout: 30 * 60 * 1000,
        silent: true
    }, options || {});
    let child;
    let promise = new Promise((resolve, reject) => {
        child = shelljs_1.default.exec(cmd, execOptions, function (code, stdout, stderr) {
            if (code !== 0) {
                throw new Error(`${code}: ${stderr}`);
            }
            else {
                resolve(stdout);
            }
        });
    });
    return {
        child,
        promise
    };
}
exports.exec = exec;
async function archive(data, dest) {
    const project = data.project;
    const dirname = path_1.default.dirname(dest);
    const ext = path_1.default.extname(dest).replace('.', '');
    const cmd = `git archive --remote=${project.git_ssh_url} --format=${ext} --output=${dest} ${data.ref}`;
    fs_extra_1.default.ensureDirSync(dirname);
    try {
        await exec(cmd).promise;
    }
    catch (err) {
        throw err;
    }
}
exports.archive = archive;
async function link(target, linkName) {
    if (fs_extra_1.default.existsSync(linkName) && fs_extra_1.default.lstatSync(linkName).isDirectory()) {
        fs_extra_1.default.removeSync(linkName);
    }
    const isMac = os_1.default.platform() === 'darwin';
    await exec(`ln ${isMac ? '-sfn' : '-sfT'} ${target} ${linkName}`).promise;
}
exports.link = link;
