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
    requestTimeout?: number;
    proxy?: string;
    logLevel?: number;
}
export interface RequestOptions {
    params?: Record<string, string | number>;
    form?: Record<string, string>;
    cookie?: string;
    referer?: string;
    noUserAgent?: boolean;
    requestTimeout?: number;
    proxy?: string;
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
    protected initRequest(url: string, { params, form, cookie, referer, noUserAgent, requestTimeout, proxy, }?: RequestOptions): {
        fullURL: string;
        request: typeof http.request | typeof https.request;
        options: http.RequestOptions;
        formStr: string;
        requestTimeout: number;
    };
    request(url: string, requestOptions?: RequestOptions): Promise<number | Res>;
    download(url: string, path: string, downloadOptions?: DownloadOptions): Promise<number>;
    existsURL(url: string, requestOptions?: RequestOptions): Promise<boolean>;
}
