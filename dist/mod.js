"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIT = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const http = require("http");
const https = require("https");
const url_1 = require("url");
const ProxyAgent = require("proxy-agent");
class CLIT {
    constructor(dirname, options = {}) {
        this.dirname = dirname;
        this.options = options;
    }
    static getDate() {
        const date = new Date();
        return [
            date.getMonth() + 1,
            date.getDate()
        ]
            .map(val => val.toString().padStart(2, '0'))
            .join('-');
    }
    static getTime() {
        const date = new Date();
        return [
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        ]
            .map(val => val.toString().padStart(2, '0'))
            .join(':')
            + ':'
            + date.getMilliseconds().toString().padStart(3, '0');
    }
    static prettyData(number) {
        if (number < 1024) {
            return number + ' B';
        }
        if (number < 1048576) {
            return Math.round(number / 1.024) / 1000 + ' KiB';
        }
        if (number < 1073741824) {
            return Math.round(number / 1048.576) / 1000 + ' MiB';
        }
        return Math.round(number / 1073741.824) / 1000 + ' GiB';
    }
    log(msg, level) {
        var _a;
        let string = CLIT.getTime() + '  ';
        if (msg instanceof Error) {
            const { stack } = msg;
            if (stack !== undefined) {
                string += stack;
            }
            else {
                string += msg.message;
            }
        }
        else {
            string += msg.toString();
        }
        string = string.replace(/\n */g, '\n              ');
        if ((level !== null && level !== void 0 ? level : 0) <= ((_a = this.options.logLevel) !== null && _a !== void 0 ? _a : 0)) {
            (0, fs_1.appendFileSync)((0, path_1.join)(this.dirname, `../info/${CLIT.getDate()}.log`), string + '\n\n');
        }
        return string;
    }
    out(msg, level) {
        console.log(this.log(msg, level) + '\n');
    }
    request(url, params, form, cookie, referer, noUserAgent, requestTimeout, proxy) {
        var _a, _b;
        if (params === void 0) { params = {}; }
        if (form === void 0) { form = {}; }
        if (cookie === void 0) { cookie = ''; }
        if (referer === void 0) { referer = ''; }
        if (noUserAgent === void 0) { noUserAgent = false; }
        if (requestTimeout === void 0) { requestTimeout = (_a = this.options.requestTimeout) !== null && _a !== void 0 ? _a : 10; }
        if (proxy === void 0) { proxy = (_b = this.options.proxy) !== null && _b !== void 0 ? _b : ''; }
        return __awaiter(this, void 0, void 0, function* () {
            const urlo = new url_1.URL(url);
            const { searchParams } = urlo;
            for (const key of Object.keys(params)) {
                searchParams.append(key, params[key].toString());
            }
            url = urlo.href;
            const headers = {};
            if (cookie.length > 0) {
                headers.Cookie = cookie;
            }
            if (referer.length > 0) {
                headers.Referer = referer;
            }
            if (!noUserAgent) {
                headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36';
            }
            const formStr = new url_1.URLSearchParams(form).toString();
            let method = 'GET';
            if (formStr.length > 0) {
                method = 'POST';
                Object.assign(headers, {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                });
            }
            const options = {
                method,
                headers,
            };
            if (proxy === 'http://xx.xx.xx.xx:3128') {
                proxy = '';
            }
            if (proxy.length === 0) {
                const { http_proxy } = process.env;
                if (http_proxy !== undefined) {
                    proxy = http_proxy;
                }
            }
            if (proxy.length > 0) {
                options.agent = new ProxyAgent(proxy);
            }
            const { request } = url.startsWith('https:') ? https : http;
            return yield new Promise((resolve) => {
                setTimeout(() => {
                    resolve(408);
                }, requestTimeout * 1000);
                const req = request(url, options, (res) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const { statusCode } = res;
                    if (statusCode === undefined) {
                        resolve(500);
                        return;
                    }
                    if (statusCode >= 400) {
                        resolve(statusCode);
                        return;
                    }
                    const cookie = ((_a = res.headers['set-cookie']) !== null && _a !== void 0 ? _a : [])
                        .map(val => val.split(';', 1)[0]).join('; ');
                    let body = '';
                    const buffers = [];
                    res.on('data', chunk => {
                        if (typeof chunk === 'string') {
                            body += chunk;
                        }
                        else if (chunk instanceof Buffer) {
                            body += chunk;
                            buffers.push(chunk);
                        }
                    });
                    res.on('end', () => {
                        resolve({
                            body,
                            buffer: Buffer.concat(buffers),
                            cookie,
                            headers: res.headers,
                            status: statusCode
                        });
                    });
                    res.on('error', err => {
                        this.log(err);
                        resolve(500);
                    });
                })).on('error', err => {
                    this.log(err);
                    resolve(500);
                });
                if (formStr.length > 0) {
                    req.write(formStr);
                }
                req.end();
            });
        });
    }
    download(url, path, params, form, cookie, referer, noUserAgent, requestTimeout, proxy, verbose) {
        var _a, _b;
        if (params === void 0) { params = {}; }
        if (form === void 0) { form = {}; }
        if (cookie === void 0) { cookie = ''; }
        if (referer === void 0) { referer = ''; }
        if (noUserAgent === void 0) { noUserAgent = false; }
        if (requestTimeout === void 0) { requestTimeout = (_a = this.options.requestTimeout) !== null && _a !== void 0 ? _a : 10; }
        if (proxy === void 0) { proxy = (_b = this.options.proxy) !== null && _b !== void 0 ? _b : ''; }
        if (verbose === void 0) { verbose = false; }
        return __awaiter(this, void 0, void 0, function* () {
            const urlo = new url_1.URL(url);
            const { searchParams } = urlo;
            for (const key of Object.keys(params)) {
                searchParams.append(key, params[key].toString());
            }
            url = urlo.href;
            const headers = {};
            if (cookie.length > 0) {
                headers.Cookie = cookie;
            }
            if (referer.length > 0) {
                headers.Referer = referer;
            }
            if (!noUserAgent) {
                headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36';
            }
            const formStr = new url_1.URLSearchParams(form).toString();
            let method = 'GET';
            if (formStr.length > 0) {
                method = 'POST';
                Object.assign(headers, {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                });
            }
            const options = {
                method,
                headers,
            };
            if (proxy === 'http://xx.xx.xx.xx:3128') {
                proxy = '';
            }
            if (proxy.length === 0) {
                const { http_proxy } = process.env;
                if (http_proxy !== undefined) {
                    proxy = http_proxy;
                }
            }
            if (proxy.length > 0) {
                options.agent = new ProxyAgent(proxy);
            }
            const { request } = url.startsWith('https:') ? https : http;
            return yield new Promise((resolve) => {
                let timeout = false;
                let streamStart = false;
                setTimeout(() => {
                    timeout = true;
                    if (!streamStart) {
                        resolve(408);
                    }
                }, requestTimeout * 1000);
                const req = request(url, options, (res) => __awaiter(this, void 0, void 0, function* () {
                    const { statusCode } = res;
                    if (statusCode === undefined) {
                        resolve(500);
                        return;
                    }
                    if (statusCode !== 200 && statusCode !== 206) {
                        resolve(statusCode);
                        return;
                    }
                    const contentLengthStr = res.headers['content-length'];
                    if (contentLengthStr === undefined) {
                        resolve(500);
                        return;
                    }
                    const contentLength = Number(contentLengthStr);
                    const prettyContentLength = CLIT.prettyData(contentLength);
                    let currentLength = 0;
                    let stream;
                    if (timeout) {
                        return;
                    }
                    try {
                        stream = (0, fs_1.createWriteStream)((0, path_1.join)(__dirname, path));
                        streamStart = true;
                    }
                    catch (err) {
                        if (err instanceof Error) {
                            this.log(err);
                        }
                        resolve(500);
                        return;
                    }
                    res.on('error', err => {
                        this.log(err);
                        stream.end();
                    });
                    stream.on('error', err => {
                        this.log(err);
                    });
                    res.on('data', chunk => {
                        currentLength += chunk.length;
                        if (verbose) {
                            process.stdout.write(`\r${(currentLength / contentLength * 100).toFixed(3)}% of ${prettyContentLength} downloaded to ${path}\r`);
                        }
                        if (timeout) {
                            stream.end();
                        }
                    });
                    stream.on('end', () => {
                        if (currentLength === contentLength) {
                            resolve(200);
                            return;
                        }
                        resolve(500);
                    });
                    res.pipe(stream);
                })).on('error', err => {
                    this.log(err);
                    resolve(500);
                });
                if (formStr.length > 0) {
                    req.write(formStr);
                }
                req.end();
            });
        });
    }
}
exports.CLIT = CLIT;
