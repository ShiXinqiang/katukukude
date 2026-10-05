import {NextResponse} from 'next/server';
import {getCurrentAdmin} from '../../../../../../lib/admin';
import {ensureMerchantSchema} from '../../../../../../lib/merchant';
export const dynamic='force-dynamic';
export async function GET(_r:Request,{params}:{params:{id:string}}){if(!await getCurrentAdmin())return NextResponse.json({message:'需要管理员权限'},{status:401});try{const db=await ensureMerchantSchema();const result=await db.query('SELECT a.action,a.details,a.created_at AS "createdAt",u.username FROM commerce_audit a LEFT JOIN users u ON u.id=a.actor_id WHERE a.target_id=$1 ORDER BY a.created_at DESC LIMIT 50',[params.id]);return NextResponse.json({events:result.rows})}catch{return NextResponse.json({message:'记录加载失败'},{status:503})}}
