/**
 * Feishu wiki tool core functions.
 * Extracted from openclaw/feishu/src/wiki.ts.
 */
export async function listSpaces(client) {
    const res = await client.wiki.space.list({});
    if (res.code !== 0)
        throw new Error(res.msg);
    return {
        spaces: res.data?.items?.map((s) => ({
            space_id: s.space_id, name: s.name, description: s.description, visibility: s.visibility,
        })) ?? [],
    };
}
export async function listNodes(client, spaceId, parentNodeToken) {
    const res = await client.wiki.spaceNode.list({
        path: { space_id: spaceId },
        params: { parent_node_token: parentNodeToken },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return {
        nodes: res.data?.items?.map((n) => ({
            node_token: n.node_token, obj_token: n.obj_token, obj_type: n.obj_type,
            title: n.title, has_child: n.has_child,
        })) ?? [],
    };
}
export async function getNode(client, token) {
    const res = await client.wiki.space.getNode({ params: { token } });
    if (res.code !== 0)
        throw new Error(res.msg);
    const node = res.data?.node;
    return {
        node_token: node?.node_token, space_id: node?.space_id, obj_token: node?.obj_token,
        obj_type: node?.obj_type, title: node?.title, parent_node_token: node?.parent_node_token,
        has_child: node?.has_child,
    };
}
export async function createNode(client, spaceId, title, objType, parentNodeToken) {
    const res = await client.wiki.spaceNode.create({
        path: { space_id: spaceId },
        data: { obj_type: objType || "docx", node_type: "origin", title, parent_node_token: parentNodeToken },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    const node = res.data?.node;
    return { node_token: node?.node_token, obj_token: node?.obj_token, obj_type: node?.obj_type, title: node?.title };
}
export async function moveNode(client, spaceId, nodeToken, targetSpaceId, targetParentToken) {
    const res = await client.wiki.spaceNode.move({
        path: { space_id: spaceId, node_token: nodeToken },
        data: { target_space_id: targetSpaceId || spaceId, target_parent_token: targetParentToken },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { success: true, node_token: res.data?.node?.node_token };
}
export async function renameNode(client, spaceId, nodeToken, title) {
    const res = await client.wiki.spaceNode.updateTitle({
        path: { space_id: spaceId, node_token: nodeToken },
        data: { title },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { success: true, node_token: nodeToken, title };
}
export async function moveDocsToWiki(client, spaceId, objToken, objType, parentWikiToken) {
    const res = await client.wiki.spaceNode.moveDocsToWiki({
        path: { space_id: spaceId },
        data: {
            obj_type: objType,
            obj_token: objToken,
            ...(parentWikiToken && { parent_wiki_token: parentWikiToken }),
        },
    });
    if (res.code !== 0)
        throw new Error(`${res.code}: ${res.msg}`);
    const wikiToken = res.data?.wiki_token;
    return {
        wiki_token: wikiToken,
        url: `https://my.feishu.cn/wiki/${wikiToken}`,
    };
}
export async function deleteNode(client, spaceId, nodeToken) {
    // SDK doesn't expose wiki node delete, use client.request() for proper auth
    const res = await client.request({
        method: "DELETE",
        url: `/open-apis/wiki/v2/spaces/${spaceId}/nodes/${nodeToken}`,
    });
    if (res.code && res.code !== 0)
        throw new Error(res.msg);
    return { success: true, space_id: spaceId, node_token: nodeToken };
}
//# sourceMappingURL=wiki.js.map