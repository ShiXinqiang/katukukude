import {NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../lib/auth';
import {getCurrentMerchant} from '../../../../lib/merchant';
import {updateAfterSale} from '../../../../lib/after-sales';
export async function PATCH(r:Request,{params}:{params:{id:string}}){try{const u=await getCurrentUser();if(!u)return NextResponse.json({message:'请先登录'},{status:401});const b=await r.json();const m=b.action==='reply'?await getCurrentMerchant():null;return NextResponse.json(await updateAfterSale(u,params.id,b,m?.merchant.id))}catch(e){return NextResponse.json({message:(e as Error).message},{status:409})}}
