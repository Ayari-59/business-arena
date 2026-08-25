"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import {
  createInvite,
  deactivateInvite,
  renameOrganization,
  requireOrgAdmin,
} from "@/services/admin.service";

async function requireOrgAdminSession(): Promise<{ userId: string; organizationId: string }> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { organizationId } = await requireOrgAdmin(session.userId);
  return { userId: session.userId, organizationId };
}

export async function newTeacherInviteAction(): Promise<void> {
  const { userId, organizationId } = await requireOrgAdminSession();
  await createInvite({ organizationId, role: "teacher", createdBy: userId });
  revalidatePath("/org");
}

export async function deactivateTeacherInviteAction(inviteId: string): Promise<void> {
  const { organizationId } = await requireOrgAdminSession();
  await deactivateInvite({ inviteId, organizationId });
  revalidatePath("/org");
}

export async function renameOrgAction(formData: FormData): Promise<void> {
  const { userId } = await requireOrgAdminSession();
  await renameOrganization(userId, String(formData.get("name") ?? ""));
  revalidatePath("/org");
}
