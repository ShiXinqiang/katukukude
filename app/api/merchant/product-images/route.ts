import {NextResponse} from "next/server";
import {createCommerceId,ensureMerchantSchema,requireMerchant,isMerchantRequiredError} from "../../../../lib/merchant";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 try {
  const {merchant}=await requireMerchant();
  if(Number(request.headers.get("content-length"))>5*1024*1024+16384)return NextResponse.json({message:"图片不能超过5MB"},{status:413});
  const reader=request.body?.getReader();
  if(!reader)return NextResponse.json({message:"请选择图片"},{status:400});
  const chunks:Uint8Array[]=[];let bytes=0;
  for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>5*1024*1024+16384){await reader.cancel();return NextResponse.json({message:"图片不能超过5MB"},{status:413});}chunks.push(part.value);}
  const form=await new Request(request.url,{method:"POST",headers:{"Content-Type":request.headers.get("content-type")||""},body:Buffer.concat(chunks)}).formData(), file=form.get("file");
  if(!(file instanceof File)||file.size===0||file.size>5*1024*1024)return NextResponse.json({message:"请选择5MB以内的图片"},{status:400});
  const content=Buffer.from(await file.arrayBuffer());
  const mime=content.subarray(0,3).equals(Buffer.from([255,216,255]))?"image/jpeg":content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?"image/png":content.toString("ascii",0,4)==="RIFF"&&content.toString("ascii",8,12)==="WEBP"?"image/webp":"";
  if(!mime||file.type!==mime)return NextResponse.json({message:"仅支持真实的JPG、PNG或WebP图片"},{status:400});
  const db=await ensureMerchantSchema(),client=await db.connect();
  try {
   await client.query("BEGIN");
   await client.query("SELECT id FROM merchants WHERE id=$1 FOR UPDATE",[merchant.id]);
   const count=await client.query("SELECT COUNT(*)::int AS n FROM product_media WHERE merchant_id=$1",[merchant.id]);
   if(count.rows[0].n>=200){await client.query("ROLLBACK");return NextResponse.json({message:"图片数量已达到上限，请联系平台整理"},{status:400});}
   const id=createCommerceId();
   await client.query("INSERT INTO product_media(id,merchant_id,mime_type,file_name,file_size,content) VALUES($1,$2,$3,$4,$5,$6)",[id,merchant.id,mime,file.name.slice(0,255),file.size,content]);
   await client.query("COMMIT");
   return NextResponse.json({url:`/api/product-images/${id}`},{status:201});
  } catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
 }catch(e){if(isMerchantRequiredError(e))return NextResponse.json({message:"需要商家权限"},{status:403});console.error("Product upload failed",e);return NextResponse.json({message:"图片上传失败，请重试"},{status:500});}
}
