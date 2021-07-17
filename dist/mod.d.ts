/// <reference types="node" />
import * as http from 'http';
export interface Res {
    body: string;
    buffer: Buffer;
    cookie: string;
    headers: http.IncomingHttpHeaders;
    status: number;
}
export interface Config {
    timeout: number;
}
export declare class CLIT {
    readonly dirname: string;
    readonly config: Config;
    constructor(dirname: string, config: Config);
    static getDate(): string;
    log(msg: string | Error): string;
    out(msg: string | Error): void;
    get(url: string, params?: Record<string, string>, form?: Record<string, string>, cookie?: string, referer?: string, noUserAgent?: boolean): Promise<number | Res>;
}
