const assert=require('node:assert/strict'),jsQR=require('jsqr'),fixture=require('./fixtures/qr-matrix.json');
const scale=8,width=fixture.rows.length*scale,rgba=new Uint8ClampedArray(width*width*4);
for(let y=0;y<width;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,c=fixture.rows[Math.floor(y/scale)][Math.floor(x/scale)]==='1'?0:255;rgba[i]=rgba[i+1]=rgba[i+2]=c;rgba[i+3]=255;}
assert.equal(jsQR(rgba,width,width).data,fixture.text);rgba.fill(255);assert.equal(jsQR(rgba,width,width),null);console.log('PASS: local QR decoder recognizes known QR pixels and rejects blank image.');
