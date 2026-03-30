/**
 * Feishu permission tool core functions.
 * Extracted from openclaw/feishu/src/perm.ts.
 */
export async function listMembers(client, token, type) {
    const res = await client.drive.permissionMember.list({
        path: { token },
        params: { type: type },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return {
        members: res.data?.items?.map((m) => ({
            member_type: m.member_type, member_id: m.member_id, perm: m.perm, name: m.name,
        })) ?? [],
    };
}
export async function addMember(client, token, type, memberType, memberId, perm) {
    const res = await client.drive.permissionMember.create({
        path: { token },
        params: { type: type, need_notification: false },
        data: { member_type: memberType, member_id: memberId, perm: perm },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { success: true, member: res.data?.member };
}
export async function removeMember(client, token, type, memberType, memberId) {
    const res = await client.drive.permissionMember.delete({
        path: { token, member_id: memberId },
        params: { type: type, member_type: memberType },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { success: true };
}
//# sourceMappingURL=perm.js.map