import {NextResponse} from "next/server";
import {getCurrentUser} from "../../../../lib/auth";
import {ensureMerchantSchema} from "../../../../lib/merchant";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:{id:string}}){
 try{
  const db=await ensureMerchantSchema();
  const result=await db.query(`SELECT pm.mime_type,pm.content,m.user_id,EXISTS(SELECT 1 FROM products p WHERE p.merchant_id=m.id AND p.status='active' AND m.status='active' AND p.images @> $2::jsonb) AS public FROM product_media pm JOIN merchants m ON m.id=pm.merchant_id WHERE pm.id=$1`,[params.id,JSON.stringify([`/api/product-images/${params.id}`])]);
  const file=result.rows[0];
  if(!file)return NextResponse.json({message:"图片不存在"},{status:404});
  if(!file.public){const user=await getCurrentUser();if(!user||(user.id!==file.user_id&&user.role!=="admin"))return NextResponse.json({message:"图片不存在"},{status:404});}
  return new NextResponse(new Uint8Array(file.content),{headers:{"Content-Type":file.mime_type,"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({message:"图片读取失败"},{status:500});}
}
