/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import * as http from 'http';
import * as https from 'https';
export interface Res {
    body: string;
    buffer: Buffer;
    cookie: string;
    headers: http.IncomingHttpHeaders;
    status: number;
}
export interface CLITOptions {
    logLevel?: number;
    proxy?: string;
    allowUnauthorized?: boolean;
    requestTimeout?: number;
}
export interface RequestOptions {
    cookie?: string;
    form?: Record<string, string>;
    noUserAgent?: boolean;
    params?: Record<string, string | number>;
    proxy?: string;
    referer?: string;
    allowUnauthorized?: boolean;
    requestTimeout?: number;
    headers?: http.OutgoingHttpHeaders;
}
export interface DownloadOptions extends RequestOptions {
    verbose?: boolean;
}
export declare class CLIT {
    readonly dirname: string;
    readonly options: CLITOptions;
    constructor(dirname: string, options?: CLITOptions);
    static getDate(): string;
    static getTime(): string;
    static prettyData(number: number): string;
    log(msg: string | number | Error, level?: number): string;
    out(msg: string | number | Error, level?: number): void;
    sleep(time: number): Promise<void>;
    protected initRequest(url: string, { params, form, cookie, referer, noUserAgent, requestTimeout, proxy, allowUnauthorized, headers: initHeaders }?: RequestOptions): {
        fullURL: string;
        request: typeof https.request | typeof http.request;
        options: https.RequestOptions;
        formStr: string;
        requestTimeout: number;
    };
    request(url: string, requestOptions?: RequestOptions): Promise<number | Res>;
    download(url: string, path: string, downloadOptions?: DownloadOptions): Promise<number>;
    existsURL(url: string, requestOptions?: RequestOptions): Promise<boolean>;
}
