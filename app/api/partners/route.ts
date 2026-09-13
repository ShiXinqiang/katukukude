import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ensureMerchantSchema, cleanOptionalText, cleanText } from "../../../lib/merchant";
import { getCurrentUser } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {name?:unknown;organization?:unknown;advantages?:unknown;channels?:unknown};
    const name=cleanText(body.name,120), organization=cleanOptionalText(body.organization,160), advantages=cleanText(body.advantages,300);
    const channels = body.channels && typeof body.channels==="object" ? body.channels as Record<string,unknown> : {};
    const cleaned=Object.fromEntries(Object.entries(channels).map(([k,v])=>[cleanText(k,40),cleanText(v,160)]).filter(([k,v])=>k&&v));
    if(!name) return NextResponse.json({message:"请填写联系人姓名"},{status:400});
    if(advantages.length<10) return NextResponse.json({message:"资源与优势至少填写10个字"},{status:400});
    if(Object.keys(cleaned).length===0) return NextResponse.json({message:"请至少填写一种联系方式"},{status:400});
    const database=await ensureMerchantSchema();
    await database.query(`CREATE TABLE IF NOT EXISTS partner_applications(
      id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      contact_name VARCHAR(120) NOT NULL,organization VARCHAR(160),advantages TEXT NOT NULL,
      channels JSONB NOT NULL,status VARCHAR(16) NOT NULL DEFAULT 'pending',
      review_note TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    ); CREATE INDEX IF NOT EXISTS partner_applications_status_idx ON partner_applications(status,created_at DESC);`);
    const user=await getCurrentUser();
    const id=randomUUID();
    await database.query("INSERT INTO partner_applications(id,user_id,contact_name,organization,advantages,channels) VALUES($1,$2,$3,$4,$5,$6::jsonb)",[id,user?.id||null,name,organization,advantages,JSON.stringify(cleaned)]);
    return NextResponse.json({ok:true,id},{status:201});
  } catch(error) {
    console.error("partner application error",error);
    return NextResponse.json({message:"提交失败，请稍后重试"},{status:500});
  }
}
