import {chatFailure} from '../../../lib/chat-response';
import {NextResponse} from 'next/server';
import {getCurrentUser} from '../../../lib/auth';
import {ChatError,listConversations,openConversation} from '../../../lib/conversations';
export const dynamic='force-dynamic';

export async function GET(r:Request){try{const u=await getCurrentUser();if(!u)return NextResponse.json({message:'请先登录后联系商家'},{status:401});const q=new URL(r.url).searchParams,page=Number(q.get('page')||1);if(!Number.isInteger(page)||page<1||page>10000)throw new ChatError('页码无效');return NextResponse.json(await listConversations(u.id,q.get('mode')||'buyer',page))}catch(e){return chatFailure(e)}}
export async function POST(r:Request){try{const u=await getCurrentUser();if(!u)return NextResponse.json({message:'请先登录后联系商家'},{status:401});return NextResponse.json(await openConversation(u.id,await r.json()),{status:201})}catch(e){return chatFailure(e)}}
