import {NextResponse} from "next/server";
import {requireMerchant,isMerchantRequiredError} from "../../../../../lib/merchant";
import {saveProduct,deleteProduct} from "../../../../../lib/product-service";
export const dynamic="force-dynamic";
export async function PATCH(request:Request,{params}:{params:{id:string}}){try{const {user,merchant}=await requireMerchant();return NextResponse.json({success:true,product:await saveProduct(await request.json(),user.id,merchant.id,params.id)});}catch(e){return NextResponse.json({message:e instanceof Error?e.message:"更新失败"},{status:isMerchantRequiredError(e)?403:409});}}
export async function DELETE(_request:Request,{params}:{params:{id:string}}){try{const {user,merchant}=await requireMerchant();return NextResponse.json(await deleteProduct(params.id,user.id,merchant.id));}catch(e){return NextResponse.json({message:e instanceof Error?e.message:"删除失败"},{status:isMerchantRequiredError(e)?403:409});}}
