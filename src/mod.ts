import {appendFileSync, WriteStream, createWriteStream, unlinkSync} from 'fs'
import {join} from 'path'
import * as http from 'http'
import * as https from 'https'
import {URL, URLSearchParams} from 'url'
import ProxyAgent = require('proxy-agent')
export interface Res {
    body: string
    buffer: Buffer
    cookie: string
    headers: http.IncomingHttpHeaders
    status: number
}
export interface CLITOptions {
    logLevel?: number
    proxy?: string
    allowUnauthorized?: boolean
    requestTimeout?: number
}
export interface RequestOptions {
    cookie?: string
    form?: Record<string, string>
    noUserAgent?: boolean
    params?: Record<string, string | number>
    proxy?: string
    referer?: string
    allowUnauthorized?: boolean
    requestTimeout?: number
    headers?: http.OutgoingHttpHeaders
}
export interface DownloadOptions extends RequestOptions {
    verbose?: boolean
}
export class CLIT {
    constructor(readonly dirname: string, readonly options: CLITOptions = {}) {}
    static getDate() {
        const date = new Date()
        return [
            date.getMonth() + 1,
            date.getDate()
        ]
            .map(val => val.toString().padStart(2, '0'))
            .join('-')
    }
    static getTime() {
        const date = new Date()
        return [
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        ]
            .map(val => val.toString().padStart(2, '0'))
            .join(':')
            + ':'
            + date.getMilliseconds().toString().padStart(3, '0')
    }
    static prettyData(number: number) {
        if (number < 1024) {
            return number + ' B'
        }
        if (number < 1048576) {
            return Math.round(number / 1.024) / 1000 + ' KiB'
        }
        if (number < 1073741824) {
            return Math.round(number / 1048.576) / 1000 + ' MiB'
        }
        return Math.round(number / 1073741.824) / 1000 + ' GiB'
    }
    log(msg: string | number | Error, level?: number) {
        let string = CLIT.getTime() + '  '
        if (msg instanceof Error) {
            const {stack} = msg
            if (stack !== undefined) {
                string += stack
            } else {
                string += msg.message
            }
        } else {
            string += msg.toString()
        }
        string = string.replace(/\n */g, '\n              ')
        if ((level ?? 0) <= (this.options.logLevel ?? 0)) {
            appendFileSync(join(this.dirname, `../info/${CLIT.getDate()}.log`), string + '\n\n')
        }
        return string
    }
    out(msg: string | number | Error, level?: number) {
        console.log(this.log(msg, level) + '\n')
    }
    async sleep(time: number) {
        await new Promise(resolve => {
            setTimeout(resolve, time * 1000)
        })
    }
    protected initRequest(url: string, {
        params,
        form,
        cookie,
        referer,
        noUserAgent,
        requestTimeout,
        proxy,
        allowUnauthorized,
        headers: initHeaders
    }: RequestOptions = {}) {
        params = params ?? {}
        form = form ?? {}
        cookie = cookie ?? ''
        referer = referer ?? ''
        noUserAgent = noUserAgent ?? false
        requestTimeout = requestTimeout ?? this.options.requestTimeout ?? 10
        proxy = proxy ?? this.options.proxy ?? ''
        allowUnauthorized = allowUnauthorized ?? this.options.allowUnauthorized ?? false
        const urlo = new URL(url)
        const {searchParams} = urlo
        for (const key of Object.keys(params)) {
            searchParams.append(key, params[key].toString())
        }
        const fullURL = urlo.href
        const headers: http.OutgoingHttpHeaders = {}
        Object.assign(headers, initHeaders)
        if (cookie.length > 0) {
            headers.Cookie = cookie
        }
        if (referer.length > 0) {
            headers.Referer = referer
        }
        if (!noUserAgent) {
            headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
        }
        const formStr = new URLSearchParams(form).toString()
        let method = 'GET'
        if (formStr.length > 0) {
            method = 'POST'
            Object.assign(headers, {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            })
        }
        const options: https.RequestOptions = {
            method,
            headers,
            rejectUnauthorized: !allowUnauthorized
        }
        if (proxy === 'http://host') {
            proxy = ''
        }
        if (proxy.length === 0) {
            proxy = process.env.http_proxy ?? ''
        }
        if (proxy.length > 0) {
            options.agent = new ProxyAgent(proxy)
        }
        const {request} = fullURL.startsWith('https:') ? https : http
        return {
            fullURL,
            request,
            options,
            formStr,
            requestTimeout
        }
    }
    async request(url: string, requestOptions?: RequestOptions) {
        const {
            fullURL,
            request,
            options,
            formStr,
            requestTimeout
        } = this.initRequest(url, requestOptions)
        return await new Promise((resolve: (val: number | Res) => void) => {
            setTimeout(() => {
                resolve(408)
            }, requestTimeout * 1000)
            const req = request(fullURL, options, async res => {
                const {statusCode} = res
                if (statusCode === undefined || statusCode >= 400) {
                    if (!res.destroyed) {
                        res.destroy()
                    }
                    resolve(statusCode ?? 500)
                    return
                }
                const cookie = (res.headers['set-cookie'] ?? [])
                    .map(val => val.split(';', 1)[0]).join('; ')
                let body = ''
                const buffers: Buffer[] = []
                res.on('data', chunk => {
                    if (typeof chunk === 'string') {
                        body += chunk
                    } else if (chunk instanceof Buffer) {
                        body += chunk
                        buffers.push(chunk)
                    }
                })
                res.on('end', () => {
                    resolve({
                        body,
                        buffer: Buffer.concat(buffers),
                        cookie,
                        headers: res.headers,
                        status: statusCode
                    })
                })
                res.on('error', err => {
                    this.log(err)
                    resolve(500)
                })
                setTimeout(() => {
                    if (!res.destroyed) {
                        res.destroy()
                    }
                    resolve(408)
                }, requestTimeout * 1000)
            }).on('error', err => {
                this.log(err)
                resolve(500)
            })
            if (formStr.length > 0) {
                req.write(formStr)
            }
            req.end()
        })
    }
    async download(url: string, path: string, downloadOptions?: DownloadOptions) {
        const {
            fullURL,
            request,
            options,
            formStr,
            requestTimeout
        } = this.initRequest(url, downloadOptions)
        const {verbose} = downloadOptions ?? {}
        return await new Promise((resolve: (val: number) => void) => {
            let timeout = false
            let streamStart = false
            setTimeout(() => {
                timeout = true
                if (!streamStart) {
                    resolve(408)
                }
            }, requestTimeout * 1000)
            const req = request(fullURL, options, async res => {
                const {statusCode} = res
                if (statusCode !== 200 && statusCode !== 206) {
                    if (!res.destroyed) {
                        res.destroy()
                    }
                    resolve(statusCode ?? 500)
                    return
                }
                const contentLengthStr = res.headers['content-length']
                if (contentLengthStr === undefined) {
                    if (!res.destroyed) {
                        res.destroy()
                    }
                    resolve(500)
                    return
                }
                const contentLength = Number(contentLengthStr)
                const prettyContentLength = CLIT.prettyData(contentLength)
                let currentLength = 0
                let stream: WriteStream
                streamStart = true
                if (timeout) {
                    if (!res.destroyed) {
                        res.destroy()
                    }
                    resolve(408)
                    return
                }
                try {
                    stream = createWriteStream(path)
                } catch (err) {
                    if (err instanceof Error) {
                        this.log(err)
                    }
                    if (!res.destroyed) {
                        res.destroy()
                    }
                    resolve(500)
                    return
                }
                res.on('error', err => {
                    this.log(err)
                    if (!stream.destroyed) {
                        stream.destroy()
                    }
                })
                stream.on('error', err => {
                    if (!res.destroyed) {
                        res.destroy()
                    }
                    this.log(err)
                })
                res.on('data', chunk => {
                    currentLength += chunk.length
                    if (verbose) {
                        process.stdout.write(`\r${(currentLength / contentLength * 100).toFixed(3)}%`)
                    }
                    if (timeout) {
                        if (!res.destroyed) {
                            res.destroy()
                        }
                        if (!stream.destroyed) {
                            stream.destroy()
                        }
                    }
                })
                stream.on('close', () => {
                    if (verbose) {
                        process.stdout.write(`\r        \n`)
                    }
                    if (currentLength === contentLength) {
                        resolve(200)
                        return
                    }
                    unlinkSync(path)
                    resolve(500)
                })
                if (verbose) {
                    this.out(`${prettyContentLength} will be downloaded to ${path}`)
                }
                res.pipe(stream)
                setTimeout(() => {
                    if (!res.destroyed) {
                        res.destroy()
                    }
                    if (!stream.destroyed) {
                        stream.destroy()
                    }
                    resolve(408)
                }, requestTimeout * 1000)
            }).on('error', err => {
                this.log(err)
                resolve(500)
            })
            if (formStr.length > 0) {
                req.write(formStr)
            }
            req.end()
        })
    }
    async existsURL(url: string, requestOptions?: RequestOptions) {
        const {
            fullURL,
            request,
            options,
            formStr,
            requestTimeout
        } = this.initRequest(url, requestOptions)
        return await new Promise((resolve: (val: boolean) => void) => {
            setTimeout(() => {
                resolve(false)
            }, requestTimeout * 1000)
            const req = request(fullURL, options, res => {
                const {statusCode} = res
                if (statusCode === undefined || statusCode >= 400) {
                    resolve(false)
                } else {
                    resolve(true)
                }
                if (!res.destroyed) {
                    res.destroy()
                }
            }).on('error', err => {
                this.log(err)
                resolve(false)
            })
            if (formStr.length > 0) {
                req.write(formStr)
            }
            req.end()
        })
    }
}