/**
 * Feishu wiki tool core functions.
 * Extracted from openclaw/feishu/src/wiki.ts.
 */

import type * as Lark from "@larksuiteoapi/node-sdk";

type ObjType = "doc" | "sheet" | "mindnote" | "bitable" | "file" | "docx" | "slides";

export async function listSpaces(client: Lark.Client) {
  const res = await client.wiki.space.list({});
  if (res.code !== 0) throw new Error(res.msg);
  return {
    spaces: res.data?.items?.map((s) => ({
      space_id: s.space_id, name: s.name, description: s.description, visibility: s.visibility,
    })) ?? [],
  };
}

export async function listNodes(client: Lark.Client, spaceId: string, parentNodeToken?: string) {
  const res = await client.wiki.spaceNode.list({
    path: { space_id: spaceId },
    params: { parent_node_token: parentNodeToken },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    nodes: res.data?.items?.map((n) => ({
      node_token: n.node_token, obj_token: n.obj_token, obj_type: n.obj_type,
      title: n.title, has_child: n.has_child,
    })) ?? [],
  };
}

export async function getNode(client: Lark.Client, token: string) {
  const res = await client.wiki.space.getNode({ params: { token } });
  if (res.code !== 0) throw new Error(res.msg);
  const node = res.data?.node;
  return {
    node_token: node?.node_token, space_id: node?.space_id, obj_token: node?.obj_token,
    obj_type: node?.obj_type, title: node?.title, parent_node_token: node?.parent_node_token,
    has_child: node?.has_child,
  };
}

export async function createNode(client: Lark.Client, spaceId: string, title: string, objType?: string, parentNodeToken?: string) {
  const res = await client.wiki.spaceNode.create({
    path: { space_id: spaceId },
    data: { obj_type: (objType as ObjType) || "docx", node_type: "origin" as const, title, parent_node_token: parentNodeToken },
  });
  if (res.code !== 0) throw new Error(res.msg);
  const node = res.data?.node;
  return { node_token: node?.node_token, obj_token: node?.obj_token, obj_type: node?.obj_type, title: node?.title };
}

export async function moveNode(client: Lark.Client, spaceId: string, nodeToken: string, targetSpaceId?: string, targetParentToken?: string) {
  const res = await client.wiki.spaceNode.move({
    path: { space_id: spaceId, node_token: nodeToken },
    data: { target_space_id: targetSpaceId || spaceId, target_parent_token: targetParentToken },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { success: true, node_token: res.data?.node?.node_token };
}

export async function renameNode(client: Lark.Client, spaceId: string, nodeToken: string, title: string) {
  const res = await client.wiki.spaceNode.updateTitle({
    path: { space_id: spaceId, node_token: nodeToken },
    data: { title },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { success: true, node_token: nodeToken, title };
}

export async function moveDocsToWiki(
  client: Lark.Client,
  spaceId: string,
  objToken: string,
  objType: string,
  parentWikiToken?: string
) {
  const res = await (client.wiki.spaceNode as any).moveDocsToWiki({
    path: { space_id: spaceId },
    data: {
      obj_type: objType,
      obj_token: objToken,
      ...(parentWikiToken && { parent_wiki_token: parentWikiToken }),
    },
  });
  if (res.code !== 0) throw new Error(`${res.code}: ${res.msg}`);
  const wikiToken = res.data?.wiki_token;
  return {
    wiki_token: wikiToken,
    url: `https://my.feishu.cn/wiki/${wikiToken}`,
  };
}

export async function deleteNode(client: Lark.Client, spaceId: string, nodeToken: string) {
  // SDK doesn't expose wiki node delete, use client.request() for proper auth
  const res = await (client as any).request({
    method: "DELETE",
    url: `/open-apis/wiki/v2/spaces/${spaceId}/nodes/${nodeToken}`,
  });
  if (res.code && res.code !== 0) throw new Error(res.msg);
  return { success: true, space_id: spaceId, node_token: nodeToken };
}
