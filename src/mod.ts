import { appendFileSync } from 'fs'
import {join} from 'path'
import * as http from 'http'
import * as https from 'https'
import {URL,URLSearchParams} from 'url'
import ProxyAgent=require('proxy-agent')
export interface Res{
    body:string
    buffer:Buffer
    cookie:string
    headers:http.IncomingHttpHeaders
    status:number
}
export interface CLITOptions{
    requestTimeout?:number
    proxies?:string[]
}
export class CLIT{
    constructor(readonly dirname:string,readonly options:CLITOptions={}){}
    static getDate(){
        const date=new Date()
        return [
            date.getMonth()+1,
            date.getDate()
        ]
        .map(val=>val.toString().padStart(2,'0'))
        .join('-')
    }
    static getTime(){
        const date=new Date()
        return [
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        ]
        .map(val=>val.toString().padStart(2,'0'))
        .join(':')
        +':'
        +date.getMilliseconds().toString().padStart(3,'0')
    }
    log(msg:string|Error){
        let string=CLIT.getTime()+'  '
        if(typeof msg!=='string'){
            const {stack}=msg
            if(stack!==undefined){
                string+=stack
            }else{
                string+=msg.message
            }
        }else{
            string+=msg
        }
        string=string.replace(/\n */g,'\n              ')
        appendFileSync(join(this.dirname,`../info/${CLIT.getDate()}.log`),string+'\n\n')
        return string
    }
    out(msg:string|Error){
        const string=this.log(msg)
        console.log(string+'\n')
    }
    async request(url:string,params:Record<string,string>={},form:Record<string,string>={},cookie='',referer='',noUserAgent=false){
        let paramsStr=new URL(url).searchParams.toString()
        if(paramsStr.length>0){
            paramsStr+='&'
        }
        paramsStr+=new URLSearchParams(params).toString()
        if(paramsStr.length>0){
            paramsStr='?'+paramsStr
        }
        url=new URL(paramsStr,url).href
        const formStr=new URLSearchParams(form).toString()
        const headers:http.OutgoingHttpHeaders={}
        if(cookie.length>0){
            headers.Cookie=cookie
        }
        if(referer.length>0){
            headers.Referer=referer
        }
        if(!noUserAgent){
            headers['User-Agent']='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
        }
        if(formStr.length>0){
            Object.assign(headers,{
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            })
        }
        const options:https.RequestOptions={
            method:formStr.length>0?'POST':'GET',
            headers:headers
        }
        let proxies=this.options.proxies??[]
        if(proxies.length===0){
            const {http_proxy}=process.env
            if(http_proxy!==undefined&&http_proxy!==''){
                proxies=[http_proxy]
            }
        }
        if(proxies.length>0){
            const i=Math.min(Math.floor(Math.random()*proxies.length),proxies.length-1)
            options.agent=new ProxyAgent(proxies[i])
        }
        const result=await new Promise((resolve:(val:number|Res)=>void)=>{
            setTimeout(()=>{
                resolve(500)
            },(this.options.requestTimeout??10)*1000)
            const httpsOrHTTP=url.startsWith('https://')?https:http
            const req=httpsOrHTTP.request(url,options,async res=>{
                const {statusCode}=res
                if(statusCode===undefined){
                    resolve(500)
                    return
                }
                if(statusCode>=400){
                    resolve(statusCode)
                    return
                }
                let cookie:string
                const cookie0=res.headers["set-cookie"]
                if(cookie0===undefined){
                    cookie=''
                }else{
                    cookie=cookie0.map(val=>val.split(';')[0]).join('; ')
                }
                let body=''
                const buffers:Buffer[]=[]
                res.on('data',chunk=>{
                    if(typeof chunk==='string'){
                        body+=chunk
                    }else if(chunk instanceof Buffer){
                        body+=chunk
                        buffers.push(chunk)
                    }
                })
                res.on('end',()=>{
                    resolve({
                        body:body,
                        buffer:Buffer.concat(buffers),
                        cookie:cookie,
                        headers:res.headers,
                        status:statusCode
                    })
                })
                res.on('error',err=>{
                    this.log(err)
                    resolve(500)
                })
            }).on('error',err=>{
                this.log(err)
                resolve(500)
            })
            if(formStr.length>0){
                req.write(formStr)
            }
            req.end()
        })
        return result
    }
}