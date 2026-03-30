/**
 * Feishu permission tool core functions.
 * Extracted from openclaw/feishu/src/perm.ts.
 */

import type * as Lark from "@larksuiteoapi/node-sdk";

export async function listMembers(client: Lark.Client, token: string, type: string) {
  const res = await client.drive.permissionMember.list({
    path: { token },
    params: { type: type as any },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    members: res.data?.items?.map((m) => ({
      member_type: m.member_type, member_id: m.member_id, perm: m.perm, name: m.name,
    })) ?? [],
  };
}

export async function addMember(client: Lark.Client, token: string, type: string, memberType: string, memberId: string, perm: string) {
  const res = await client.drive.permissionMember.create({
    path: { token },
    params: { type: type as any, need_notification: false },
    data: { member_type: memberType as any, member_id: memberId, perm: perm as any },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { success: true, member: res.data?.member };
}

export async function removeMember(client: Lark.Client, token: string, type: string, memberType: string, memberId: string) {
  const res = await client.drive.permissionMember.delete({
    path: { token, member_id: memberId },
    params: { type: type as any, member_type: memberType as any },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { success: true };
}
