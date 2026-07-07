import { PrismaClient } from "@prisma/client";
async function main() {
  const p = new PrismaClient({datasources:{db:{url:process.env.DATABASE_URL+"&connection_limit=1"}}});
  const org = await p.organization.findUnique({where:{slug:"qicloud-demo"}});
  if(!org){console.log("org not found");process.exit(1)}
  const docs = await p.document.findMany({where:{organizationId:org.id,chunkCount:0}});
  console.log(docs.length,"empty docs to delete");
  for(const d of docs){await p.document.delete({where:{id:d.id}});console.log("DEL",d.name)}
  await p.$disconnect();
}
main();
