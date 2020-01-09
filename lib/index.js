"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const events_1 = __importDefault(require("events"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const util_1 = require("./util");
class Deploy extends events_1.default {
    constructor(options) {
        super();
        const data = this.data = options.data;
        this.id = options.id;
        this.type = options.type;
        this.path_with_namespace = data.project.path_with_namespace;
        this.archiveDir = options.archiveDir || os_1.default.tmpdir();
        this.targetDir = options.targetDir || '';
        this.logDir = options.logDir || '';
        this.engine = options.engine || '';
        this.containerName = this.getContainerName();
        this.sourceDir = path_1.default.join(this.archiveDir, this.path_with_namespace, data.checkout_sha + '-' + this.id);
        this.tgz = this.sourceDir + '.tgz';
    }
    async start() {
        try {
            await this.download();
            await this.build();
            await this.sync();
            await this.clean();
        }
        catch (error) {
            await this.clean(true);
            throw error;
        }
    }
    async download() {
        const { data, sourceDir, tgz } = this;
        await util_1.retry(() => util_1.archive(data, tgz), 5, 5 * 1000);
        await util_1.archive(data, tgz);
        await util_1.unzip(tgz, sourceDir);
    }
    async build() {
        const { type, sourceDir, containerName } = this;
        const pkg = require(path_1.default.join(sourceDir, 'package.json'));
        const buildOptions = pkg.build || pkg.cloudBuild;
        if (!buildOptions) {
            return;
        }
        const build = type && buildOptions[type] ? Object.assign({}, buildOptions[type], buildOptions) : buildOptions;
        if (!build.script) {
            return;
        }
        const engine = build.engine || this.engine || '8';
        const registry = build.registry || 'https://registry.dingxiang-inc.com';
        const yarn = fs_extra_1.default.existsSync(path_1.default.join(sourceDir, 'yarn.lock')) || build.yarn;
        const install = [
            yarn ? 'yarn' : 'npm i',
            `--registry=${registry}`
        ].join(' ');
        const timezone = [
            'ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime',
            'echo Asia/Shanghai > /etc/timezone'
        ].join(' && ');
        const cmd = `
      docker run \
      --rm \
      --name ${containerName} \
      --env NODE_ENV=development \
      -v ${sourceDir}:/var/www \
      -w /var/www \
      node:${engine} \
      sh -c '${timezone} && ${install} && ${build.script}'
    `;
        await this.exec(cmd);
    }
    async sync() {
        const buildDir = this.getBuildDir();
        if (!buildDir) {
            throw new Error('no build dir');
        }
        const { sourceDir, targetDir, data } = this;
        const emitData = {
            target: path_1.default.join(targetDir, this.path_with_namespace),
            actual: path_1.default.join(targetDir, '_data', this.path_with_namespace, data.checkout_sha)
        };
        this.emit('sync', emitData);
        const { target, actual } = emitData;
        let linkPath = '';
        try {
            linkPath = fs_extra_1.default.readlinkSync(target);
        }
        catch (err) { }
        if (fs_extra_1.default.existsSync(actual)) {
            fs_extra_1.default.removeSync(actual);
        }
        const cwd = path_1.default.dirname(target);
        fs_extra_1.default.ensureDirSync(cwd);
        fs_extra_1.default.ensureDirSync(actual);
        fs_extra_1.default.copySync(path_1.default.join(sourceDir, buildDir), actual);
        await util_1.link(path_1.default.relative(cwd, actual), target.split(path_1.default.sep).pop(), {
            cwd
        });
        this.emit('sync.after', {
            beforePath: linkPath ? path_1.default.resolve(cwd, linkPath) : '',
            afterPath: actual,
            data
        });
    }
    async clean(error) {
        const { containerName, sourceDir, tgz } = this;
        fs_extra_1.default.removeSync(sourceDir);
        fs_extra_1.default.removeSync(tgz);
        try {
            const docker = await util_1.exec(`docker ps | grep ${containerName}`).promise;
            if (docker) {
                await util_1.exec(`docker rm ${containerName}`).promise;
            }
        }
        catch (error) { }
        if (!error) {
            this.cleanLogFile();
        }
        this.emit('clean');
    }
    async exec(cmd) {
        const { child, promise } = util_1.exec(cmd);
        const file = this.getLogFile();
        if (child) {
            if (child.stdout) {
                child.stdout.pipe(fs_extra_1.default.createWriteStream(file, { flags: 'a' }));
            }
            if (child.stderr) {
                child.stderr.pipe(fs_extra_1.default.createWriteStream(file, { flags: 'a' }));
            }
        }
        await promise;
    }
    getContainerName() {
        const { data, id } = this;
        return [
            data.project.namespace,
            data.project.name,
            data.checkout_sha,
            id
        ].join('-');
    }
    getBuildDir() {
        return 'build';
    }
    getLogFile() {
        const { id, logDir } = this;
        return path_1.default.join(logDir, `deploy-${id}.log`);
    }
    cleanLogFile() {
        const file = this.getLogFile();
        if (fs_extra_1.default.existsSync(file)) {
            fs_extra_1.default.removeSync(file);
        }
    }
}
exports.default = Deploy;
