import {NextResponse} from 'next/server';
import {ChatError} from './conversations';
export function chatFailure(e:unknown){if(e instanceof ChatError)return NextResponse.json({message:e.message},{status:e.status});console.error('chat request failed',{code:(e as {code?:string})?.code||'UNKNOWN'});return NextResponse.json({message:'消息服务暂时不可用，请重试'},{status:503})}
