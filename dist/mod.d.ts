/// <reference types="node" />
import * as http from 'http';
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
    request(url: string, params?: Record<string, string | number>, form?: Record<string, string>, cookie?: string, referer?: string, noUserAgent?: boolean, requestTimeout?: number, proxy?: string): Promise<number | Res>;
    download(url: string, path: string, params?: Record<string, string | number>, form?: Record<string, string>, cookie?: string, referer?: string, noUserAgent?: boolean, requestTimeout?: number, proxy?: string, verbose?: boolean): Promise<number>;
}
