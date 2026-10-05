import {NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../../lib/auth';
import {readMessages,sendMessage,markConversationRead} from '../../../../../lib/conversations';
import {chatFailure} from '../../../../../lib/chat-response';
export const dynamic='force-dynamic';
export async function GET(r:Request,{params}:{params:{id:string}}){try{const u=await getCurrentUser();if(!u)return NextResponse.json({message:'请先登录'},{status:401});const q=new URL(r.url).searchParams;return NextResponse.json(await readMessages(u.id,params.id,q.get('after')||'0',q.get('before')||'0'))}catch(e){return chatFailure(e)}}
export async function POST(r:Request,{params}:{params:{id:string}}){try{const u=await getCurrentUser();if(!u)return NextResponse.json({message:'请先登录'},{status:401});return NextResponse.json({message:await sendMessage(u.id,params.id,await r.json())},{status:201})}catch(e){return chatFailure(e)}}
export async function PATCH(r:Request,{params}:{params:{id:string}}){try{const u=await getCurrentUser();if(!u)return NextResponse.json({message:'请先登录'},{status:401});await markConversationRead(u.id,params.id,(await r.json()).seq);return NextResponse.json({ok:true})}catch(e){return chatFailure(e)}}
