BEGIN;
SET LOCAL search_path=katu,public;
LOCK TABLE shop_conversations,shop_messages IN ACCESS EXCLUSIVE MODE;
ALTER TABLE shop_conversations ADD COLUMN IF NOT EXISTS merged_into TEXT REFERENCES shop_conversations(id);
ALTER TABLE shop_messages ADD COLUMN IF NOT EXISTS context JSONB;
UPDATE shop_messages x SET context=c.context FROM shop_conversations c WHERE x.conversation_id=c.id AND x.context IS NULL;
CREATE TEMP TABLE chat_merge_map ON COMMIT DROP AS
 SELECT id,first_value(id) OVER(PARTITION BY buyer_id,merchant_id ORDER BY created_at,id) AS keep_id
 FROM shop_conversations WHERE merged_into IS NULL;
-- Preserve all messages even if two old threads happened to reuse a client nonce.
WITH ranked AS (
 SELECT x.id,row_number() OVER(PARTITION BY m.keep_id,x.sender_id,x.client_nonce ORDER BY x.seq) AS n
 FROM shop_messages x JOIN chat_merge_map m ON m.id=x.conversation_id
)
UPDATE shop_messages x SET client_nonce=x.client_nonce||':merged:'||x.id FROM ranked r WHERE r.id=x.id AND r.n>1;
UPDATE shop_messages x SET conversation_id=m.keep_id FROM chat_merge_map m WHERE x.conversation_id=m.id AND m.id<>m.keep_id;
WITH stats AS (
 SELECT m.keep_id,min(c.buyer_read_seq) AS buyer_read,min(c.seller_read_seq) AS seller_read,max(c.updated_at) AS updated
 FROM chat_merge_map m JOIN shop_conversations c ON c.id=m.id GROUP BY m.keep_id HAVING count(*)>1
),latest AS (
 SELECT DISTINCT ON(m.keep_id) m.keep_id,c.context FROM chat_merge_map m JOIN shop_conversations c ON c.id=m.id ORDER BY m.keep_id,c.updated_at DESC,c.id
)
UPDATE shop_conversations c SET buyer_read_seq=s.buyer_read,seller_read_seq=s.seller_read,updated_at=s.updated,context=l.context,
 last_message=COALESCE((SELECT left(content,120) FROM shop_messages WHERE conversation_id=c.id ORDER BY seq DESC LIMIT 1),c.last_message)
FROM stats s JOIN latest l ON l.keep_id=s.keep_id WHERE c.id=s.keep_id;
UPDATE shop_conversations c SET merged_into=m.keep_id FROM chat_merge_map m WHERE c.id=m.id AND m.id<>m.keep_id;
CREATE UNIQUE INDEX IF NOT EXISTS shop_conversations_pair_idx ON shop_conversations(buyer_id,merchant_id) WHERE merged_into IS NULL;
COMMIT;
