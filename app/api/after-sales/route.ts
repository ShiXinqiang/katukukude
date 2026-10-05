import {NextResponse} from 'next/server';
import {getCurrentUser} from '../../../lib/auth';
import {ensureMerchantSchema,requireMerchant} from '../../../lib/merchant';
import {requestAfterSale} from '../../../lib/after-sales';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const u=await getCurrentUser();if(!u)return NextResponse.json({message:'请先登录'},{status:401});const mode=new URL(request.url).searchParams.get('mode'),db=await ensureMerchantSchema();let where='a.user_id=$1',params=[u.id];if(mode==='admin'){if(u.role!=='admin')return NextResponse.json({message:'需要管理员权限'},{status:403});where='TRUE';params=[]}else if(mode==='merchant'){const {merchant}=await requireMerchant();where='a.merchant_id=$1';params=[merchant.id]}
 const r=await db.query(`SELECT a.*,o.order_no,o.items,o.status AS order_status FROM after_sales a JOIN orders o ON o.id=a.order_id WHERE ${where} ORDER BY a.created_at DESC LIMIT 200`,params);return NextResponse.json({cases:r.rows})}catch{return NextResponse.json({message:'售后记录加载失败'},{status:503})}}
export async function POST(request:Request){try{const u=await getCurrentUser();if(!u)return NextResponse.json({message:'请先登录'},{status:401});return NextResponse.json(await requestAfterSale(u,await request.json()),{status:201})}catch(e){return NextResponse.json({message:(e as Error).message},{status:400})}}
