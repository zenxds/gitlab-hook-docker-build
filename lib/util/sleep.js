"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sleep(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
}
exports.sleep = sleep;
