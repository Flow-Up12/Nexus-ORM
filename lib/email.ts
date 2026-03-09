/**
 * Email service stub. Logs payload; ready for EMAIL_* env vars when provider is added.
 */
export async function sendInvitationEmail(
  to: string,
  projectName: string,
  inviteLink: string
): Promise<void> {
  console.log("[Email stub] Would send invitation:", {
    to,
    projectName,
    inviteLink,
    // When EMAIL_* is configured, implement actual send here
  })
}
