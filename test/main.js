const {CLIT}=require('../dist/mod')
const clit=new CLIT(__dirname)
;(async ()=>{
    console.log(await clit.request('https://en.wikipedia.org/wiki/Main_Page'))
    clit.out(await clit.download('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4','flower.mp4',{verbose:true}))
})()