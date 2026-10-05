import {getCurrentUser} from '../../../../../lib/auth';
import {ChatError,readMessages,cursor} from '../../../../../lib/conversations';
import {chatFailure} from '../../../../../lib/chat-response';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:{id:string}}){
 try{
  const user=await getCurrentUser();if(!user)throw new ChatError('登录已失效，请重新登录',401);
  let after=cursor(request.headers.get('last-event-id')||new URL(request.url).searchParams.get('after')||'0');
  const first=await readMessages(user.id,params.id,after);
  let timer:ReturnType<typeof setTimeout>|undefined,closed=false;
  const encoder=new TextEncoder();
  const stream=new ReadableStream({start(controller){
   const close=()=>{if(closed)return;closed=true;clearTimeout(timer);request.signal.removeEventListener('abort',close);try{controller.close()}catch{}};
   const emit=(d:typeof first)=>{if(closed)return;const last=d.messages.at(-1);if(last)after=last.seq;controller.enqueue(encoder.encode(`id: ${after}\nevent: messages\ndata: ${JSON.stringify(d)}\n\n`))};
   request.signal.addEventListener('abort',close,{once:true});if(request.signal.aborted){close();return}emit(first);
   const started=Date.now();
   const tick=async()=>{if(closed)return;try{const current=await getCurrentUser();if(!current||current.id!==user.id)throw new ChatError('登录已失效',401);const d=await readMessages(user.id,params.id,after);emit(d);if(Date.now()-started>25000){close();return}}catch(e){if(!closed)controller.enqueue(encoder.encode(`event: accessError\ndata: ${JSON.stringify({message:e instanceof ChatError?e.message:'连接中断，请重试'})}\n\n`));close();return}if(!closed)timer=setTimeout(tick,2000)};
   timer=setTimeout(tick,2000);
  },cancel(){closed=true;clearTimeout(timer)}});
  return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'}});
 }catch(e){return chatFailure(e)}
}
