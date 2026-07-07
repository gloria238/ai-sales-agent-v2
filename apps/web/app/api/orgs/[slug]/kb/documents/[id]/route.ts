/**
 * Single Document API — GET, PATCH, DELETE
 *
 * GET    /api/orgs/{slug}/kb/documents/{id}      — document details + chunk list
 * PATCH  /api/orgs/{slug}/kb/documents/{id}      — update name/metadata
 * DELETE /api/orgs/{slug}/kb/documents/{id}      — delete document + cascaded chunks
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@salesagent/db";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string; id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "view_agents"); if (_perm) return _perm;

  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, type: true, status: true,
      chunkCount: true, metadata: true, createdAt: true, updatedAt: true,
    },
  });

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // Optionally include chunk listing
  const chunks = await prisma.documentChunk.findMany({
    where: { documentId: params.id },
    select: { id: true, chunkIndex: true, content: true, metadata: true },
    orderBy: { chunkIndex: "asc" },
  });

  return NextResponse.json({
    document: doc,
    chunks: chunks.map((c) => ({
      id: c.id,
      index: c.chunkIndex,
      content: c.content.slice(0, 300),
      fullContentLength: c.content.length,
      metadata: c.metadata,
    })),
    totalChunks: chunks.length,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string; id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  // Verify the document belongs to this org
  const existing = await prisma.document.findUnique({ where: { id: params.id } });
  if (!existing || existing.organizationId !== membership.organizationId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const body = (await req.json()) as { name?: string; metadata?: Record<string, unknown> };
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.metadata !== undefined) updateData.metadata = body.metadata;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update (name, metadata)" }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ document: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, organization: { slug: params.slug } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const _perm = checkPermission(membership.role, "manage_agents"); if (_perm) return _perm;

  // Verify the document belongs to this org
  const existing = await prisma.document.findUnique({ where: { id: params.id } });
  if (!existing || existing.organizationId !== membership.organizationId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Prisma cascade deletes DocumentChunks (onDelete: Cascade on DocumentChunk.document)
  await prisma.document.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true, deletedId: params.id });
}
