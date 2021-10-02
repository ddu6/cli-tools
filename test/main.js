const {CLIT}=require('../dist/mod')
const clit=new CLIT(__dirname)
;(async ()=>{
    console.log(await clit.request('https://en.wikipedia.org/wiki/Main_Page'))
    clit.out(await clit.download('https://tx.dogevideo.com/vcloud/17/v/20190424/1556036075_818c4125ec9c8cbc7a7a8a7cc1601512/1037/7d515b22c4958598c0fbd1e6290a5ca5.mp4?vkey=B75069&tkey=1633172575cf2fce68bf&auth_key=1633186975-gE3lcrQR7VKo1MjJ-0-a4a64d3ffcd668375daf28eb703ea0ba','test.mp4',{},{},'','',undefined,undefined,undefined,true))
})()