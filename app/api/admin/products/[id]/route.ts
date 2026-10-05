import {NextResponse} from "next/server";
import {getCurrentAdmin} from "../../../../../lib/admin";
import {saveProduct,deleteProduct} from "../../../../../lib/product-service";
export const dynamic="force-dynamic";
export async function PATCH(request:Request,{params}:{params:{id:string}}){try{const admin=await getCurrentAdmin();if(!admin)return NextResponse.json({message:"需要管理员权限"},{status:401});return NextResponse.json({success:true,...await saveProduct(await request.json(),admin.id,undefined,params.id,true)});}catch(e){return NextResponse.json({message:e instanceof Error?e.message:"更新失败"},{status:409});}}
export async function DELETE(_request:Request,{params}:{params:{id:string}}){try{const admin=await getCurrentAdmin();if(!admin)return NextResponse.json({message:"需要管理员权限"},{status:401});return NextResponse.json(await deleteProduct(params.id,admin.id));}catch(e){return NextResponse.json({message:e instanceof Error?e.message:"删除失败"},{status:409});}}
