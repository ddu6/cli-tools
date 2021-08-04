const {CLIT}=require('../dist/mod')
const clit=new CLIT(__dirname)
clit.request('https://en.wikipedia.org/wiki/Main_Page').then(console.log)