"use strict";
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
        if ((level ?? 0) <= (this.options.logLevel ?? 0)) {
            (0, fs_1.appendFileSync)((0, path_1.join)(this.dirname, `../info/${CLIT.getDate()}.log`), string + '\n\n');
        }
        return string;
    }
    out(msg, level) {
        console.log(this.log(msg, level) + '\n');
    }
    async request(url, params = {}, form = {}, cookie = '', referer = '', noUserAgent = false, requestTimeout = this.options.requestTimeout ?? 10, proxy = this.options.proxy ?? '') {
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
            proxy = process.env.http_proxy ?? '';
        }
        if (proxy.length > 0) {
            options.agent = new ProxyAgent(proxy);
        }
        const { request } = url.startsWith('https:') ? https : http;
        return await new Promise((resolve) => {
            setTimeout(() => {
                resolve(408);
            }, requestTimeout * 1000);
            const req = request(url, options, async (res) => {
                const { statusCode } = res;
                if (statusCode === undefined) {
                    resolve(500);
                    return;
                }
                if (statusCode >= 400) {
                    resolve(statusCode);
                    return;
                }
                const cookie = (res.headers['set-cookie'] ?? [])
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
            }).on('error', err => {
                this.log(err);
                resolve(500);
            });
            if (formStr.length > 0) {
                req.write(formStr);
            }
            req.end();
        });
    }
    async download(url, path, params = {}, form = {}, cookie = '', referer = '', noUserAgent = false, requestTimeout = this.options.requestTimeout ?? 10, proxy = this.options.proxy ?? '', verbose = false) {
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
            proxy = process.env.http_proxy ?? '';
        }
        if (proxy.length > 0) {
            options.agent = new ProxyAgent(proxy);
        }
        const { request } = url.startsWith('https:') ? https : http;
        return await new Promise((resolve) => {
            let timeout = false;
            let streamStart = false;
            setTimeout(() => {
                timeout = true;
                if (!streamStart) {
                    resolve(408);
                }
            }, requestTimeout * 1000);
            const req = request(url, options, async (res) => {
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
                    stream = (0, fs_1.createWriteStream)(path);
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
                    res.destroy();
                    this.log(err);
                });
                res.on('data', chunk => {
                    currentLength += chunk.length;
                    if (verbose) {
                        process.stdout.write(`\r${(currentLength / contentLength * 100).toFixed(3)}%`);
                    }
                    if (timeout) {
                        res.destroy();
                        stream.end();
                    }
                });
                stream.on('close', () => {
                    if (verbose) {
                        process.stdout.write(`\r        \n`);
                    }
                    if (currentLength === contentLength) {
                        resolve(200);
                        return;
                    }
                    (0, fs_1.unlinkSync)(path);
                    resolve(500);
                });
                if (verbose) {
                    this.out(`${prettyContentLength} will be downloaded to ${path}`);
                }
                res.pipe(stream);
            }).on('error', err => {
                this.log(err);
                resolve(500);
            });
            if (formStr.length > 0) {
                req.write(formStr);
            }
            req.end();
        });
    }
}
exports.CLIT = CLIT;
