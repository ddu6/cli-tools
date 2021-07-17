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
class CLIT {
    constructor(dirname, config) {
        this.dirname = dirname;
        this.config = config;
    }
    static getDate() {
        const date = new Date();
        return [
            date.getMonth() + 1,
            date.getDate()
        ]
            .map(val => val.toString().padStart(2, '0'))
            .join('-')
            + ' '
            + [
                date.getHours(), date.getMinutes(),
                date.getSeconds()
            ]
                .map(val => val.toString().padStart(2, '0'))
                .join(':')
            + ':'
            + date.getMilliseconds().toString().padStart(3, '0');
    }
    log(msg) {
        let string = CLIT.getDate() + '  ';
        if (typeof msg !== 'string') {
            const { stack } = msg;
            if (stack !== undefined) {
                string += stack;
            }
            else {
                string += msg.message;
            }
        }
        else {
            string += msg;
        }
        string = string.replace(/\n */g, '\n                    ');
        fs_1.appendFileSync(path_1.join(this.dirname, '../info/log.txt'), string + '\n\n');
        return string;
    }
    out(msg) {
        const string = this.log(msg);
        console.log(string + '\n');
    }
    get(url, params = {}, form = {}, cookie = '', referer = '', noUserAgent = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let paramsStr = new url_1.URL(url).searchParams.toString();
            if (paramsStr.length > 0) {
                paramsStr += '&';
            }
            paramsStr += new url_1.URLSearchParams(params).toString();
            if (paramsStr.length > 0) {
                paramsStr = '?' + paramsStr;
            }
            url = new url_1.URL(paramsStr, url).href;
            const formStr = new url_1.URLSearchParams(form).toString();
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
            if (formStr.length > 0) {
                Object.assign(headers, {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                });
            }
            const options = {
                method: formStr.length > 0 ? 'POST' : 'GET',
                headers: headers
            };
            const result = yield new Promise((resolve) => {
                setTimeout(() => {
                    resolve(500);
                }, this.config.timeout * 1000);
                const httpsOrHTTP = url.startsWith('https://') ? https : http;
                const req = httpsOrHTTP.request(url, options, (res) => __awaiter(this, void 0, void 0, function* () {
                    const { statusCode } = res;
                    if (statusCode === undefined) {
                        resolve(500);
                        return;
                    }
                    if (statusCode >= 400) {
                        resolve(statusCode);
                        return;
                    }
                    let cookie;
                    const cookie0 = res.headers["set-cookie"];
                    if (cookie0 === undefined) {
                        cookie = '';
                    }
                    else {
                        cookie = cookie0.map(val => val.split(';')[0]).join('; ');
                    }
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
                            body: body,
                            buffer: Buffer.concat(buffers),
                            cookie: cookie,
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
            return result;
        });
    }
}
exports.CLIT = CLIT;
