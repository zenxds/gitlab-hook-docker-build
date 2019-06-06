"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sleep_1 = require("./sleep");
async function retry(fn, times = 3, delay = 200) {
    for (let i = 0; i < times; i++) {
        try {
            return await fn();
        }
        catch (err) {
            if (i === times - 1) {
                throw err;
            }
            else {
                await sleep_1.sleep(delay);
            }
        }
    }
}
exports.retry = retry;
