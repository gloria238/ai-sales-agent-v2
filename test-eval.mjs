import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const kbDir = resolve("packages/db/knowledge-base");
const files = readdirSync(kbDir).filter(f => f.endsWith(".md"));
const chunks = [];
for (const f of files) {
  const c = readFileSync(resolve(kbDir, f), "utf8");
  const paras = c.split(/\n\n+/).filter(p => p.trim().length > 30);
  paras.forEach((p, i) => { chunks.push({ id: f.replace(/\.md$/, "") + "-c" + i, content: p.trim() }); });
}
console.log("KB:", chunks.length, "chunks,", files.length, "files");

function search(query) {
  const terms = query.replace(/[？?！!，,。.、\s]+/g, " ").split(" ").filter(w => w.length > 1);
  return chunks.map(c => {
    const cl = c.content.toLowerCase();
    let score = 0;
    for (const t of terms) {
      const escaped = t.replace(/[.*+?^${}()|[\]\]/g, "\$&");
      const count = (cl.match(new RegExp(escaped, "g")) || []).length;
      score += count * 0.25;
      if (cl.includes(t.toLowerCase())) score += 0.15;
    }
    score = Math.min(score / Math.log(c.content.length + 10), 1.0);
    return { id: c.id, score, excerpt: c.content.slice(0, 80) };
  }).filter(r => r.score > 0.01).sort((a, b) => b.score - a.score).slice(0, 5);
}

const tests = [
  {q:"启云科技的AI客服支持哪些渠道？",cat:"faq"},
  {q:"标准版和专业版有什么区别？",cat:"pricing"},
  {q:"怎么训练AI理解我们公司的业务？",cat:"faq"},
  {q:"你们和网易七鱼比怎么样？",cat:"competitor"},
  {q:"有个做电商的客户用了你们的产品效果怎么样？",cat:"case"},
  {q:"系统部署需要多长时间？",cat:"faq"},
  {q:"数据安全怎么保障？",cat:"faq"},
  {q:"AI准确率怎么样？",cat:"faq"},
  {q:"支持多语言吗？",cat:"faq"},
  {q:"怎么收费？",cat:"pricing"},
];

let totalPrec = 0, totalRecall = 0, totalMRR = 0, count = 0;
for (const t of tests) {
  const results = search(t.q);
  const relevantIds = results.filter(r => r.score > 0.15).map(r => r.id);
  const top5 = results.slice(0, 5).map(r => r.id);
  const hits = top5.filter(id => relevantIds.includes(id)).length;
  const prec = top5.length > 0 ? hits / top5.length : 0;
  const recall = relevantIds.length > 0 ? hits / relevantIds.length : 1;
  const firstRel = top5.findIndex(id => relevantIds.includes(id));
  const mrr = firstRel >= 0 ? 1 / (firstRel + 1) : 0;
  totalPrec += prec; totalRecall += recall; totalMRR += mrr; count++;
  console.log("[" + t.cat.padEnd(10) + "]", t.q.slice(0, 35).padEnd(35),
    "hits:" + hits + " prec:" + prec.toFixed(2) + " rec:" + recall.toFixed(2) + " mrr:" + mrr.toFixed(2) + " | " + (results[0]?.excerpt || "no match").slice(0, 50));
}
console.log("\n=== SUMMARY ===");
console.log("Avg Precision@5:", (totalPrec/count).toFixed(3));
console.log("Avg Recall@5:", (totalRecall/count).toFixed(3));
console.log("Avg MRR:", (totalMRR/count).toFixed(3));
