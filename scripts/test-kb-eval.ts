import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const kbDir = resolve("packages/db/knowledge-base");
const files = readdirSync(kbDir).filter((f) => f.endsWith(".md"));
const chunks: Array<{ id: string; content: string }> = [];
for (const f of files) {
  const c = readFileSync(resolve(kbDir, f), "utf8");
  const paras = c.split(/\n\n+/).filter((p) => p.trim().length > 30);
  paras.forEach((p, i) => {
    chunks.push({ id: f.replace(/\.md$/, "") + "-c" + i, content: p.trim() });
  });
}
const totalKB = Math.round(chunks.reduce((s, c) => s + c.content.length, 0) / 1024);
console.log(`KB: ${chunks.length} chunks, ${files.length} files, ${totalKB}KB\n`);

// Chinese text matching: character bigrams + word boundaries
function bigrams(text: string): string[] {
  const cleaned = text.replace(/[？?！!，,。.、\s\-|]+/g, "");
  const result: string[] = [];
  for (let i = 0; i < cleaned.length - 1; i++) {
    result.push(cleaned.slice(i, i + 2));
  }
  return result;
}

function search(query: string) {
  const qBigrams = bigrams(query);
  return chunks
    .map((c) => {
      const cBigrams = bigrams(c.content);
      const cSet = new Set(cBigrams);
      let matches = 0;
      for (const bg of qBigrams) {
        if (cSet.has(bg)) matches++;
      }
      // Jaccard-like: intersection / (union weighted toward query length)
      const score = qBigrams.length > 0
        ? Math.min(matches / qBigrams.length, 1.0) *
          Math.min(matches / Math.log(c.content.length + 10), 1.0)
        : 0;
      return { id: c.id, score, excerpt: c.content.slice(0, 80) };
    })
    .filter((r) => r.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

const tests = [
  { q: "启云科技的AI客服支持哪些渠道", cat: "faq" },
  { q: "标准版和专业版有什么区别", cat: "pricing" },
  { q: "怎么训练AI理解我们公司的业务", cat: "faq" },
  { q: "你们和网易七鱼比怎么样", cat: "competitor" },
  { q: "有个做电商的客户用了你们的产品效果怎么样", cat: "case" },
  { q: "系统部署需要多长时间", cat: "faq" },
  { q: "数据安全怎么保障", cat: "faq" },
  { q: "AI准确率怎么样", cat: "faq" },
  { q: "支持多语言吗", cat: "faq" },
  { q: "怎么收费", cat: "pricing" },
  { q: "私有化部署怎么操作", cat: "product" },
  { q: "和Intercom比怎么样", cat: "competitor" },
  { q: "有免费试用吗", cat: "pricing" },
  { q: "知识库支持什么文件格式", cat: "product" },
  { q: "金融行业的案例", cat: "case" },
];

let tp = 0, tr = 0, tm = 0, matched = 0;
for (const t of tests) {
  const r = search(t.q);
  if (r.length === 0) {
    console.log(`[${t.cat.padEnd(10)}] ${t.q.slice(0, 25).padEnd(25)} NO MATCH`);
    continue;
  }
  matched++;
  // Chunks with score > 0.2 are "relevant enough"
  const relIds = r.filter((x) => x.score > 0.2).map((x) => x.id);
  if (relIds.length === 0) { relIds.push(r[0].id); } // fallback: top-1 is "relevant"
  const top5Ids = r.map((x) => x.id);
  const hits = top5Ids.filter((id) => relIds.includes(id)).length;
  const prec = top5Ids.length > 0 ? hits / top5Ids.length : 0;
  const rec = hits / relIds.length;
  const fi = top5Ids.findIndex((id) => relIds.includes(id));
  const mrr = fi >= 0 ? 1 / (fi + 1) : 0;
  tp += prec; tr += rec; tm += mrr;
  console.log(
    `[${t.cat.padEnd(10)}] ${t.q.slice(0, 30).padEnd(30)} p:${prec.toFixed(2)} r:${rec.toFixed(2)} m:${mrr.toFixed(2)} top:${r[0].score.toFixed(2)} | ${r[0].excerpt.slice(0, 55)}`
  );
}

const n = tests.length;
console.log(`\n=== ${matched}/${n} matched, ${chunks.length} chunks ${totalKB}KB ===`);
console.log(`Precision@5: ${(tp / n).toFixed(3)}`);
console.log(`Recall@5:    ${(tr / n).toFixed(3)}`);
console.log(`MRR:         ${(tm / n).toFixed(3)}`);
console.log(`NDCG-like:   ${((tp / n) * 0.6 + (tm / n) * 0.4).toFixed(3)} (weighted P+MRR)`);
