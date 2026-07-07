import { createEmbeddingProvider } from "@salesagent/rag-core/embeddings";
const e = createEmbeddingProvider();
const v = await e.embed("你好世界");
console.log("维度:", v.length);
console.log("前3维:", v.slice(0, 3).map((x) => x.toFixed(6)));
