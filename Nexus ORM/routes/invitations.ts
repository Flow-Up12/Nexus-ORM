import { Router } from "express"
import crypto from "crypto"
import { meta } from "../../lib/meta.js"
import { authMiddleware, type AuthenticatedRequest } from "../../lib/auth.js"
import { sendInvitationEmail } from "../../lib/email.js"

const router = Router()

router.get("/pending", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })

    const invitations = await meta.projectInvitation.findMany({
      where: { email: req.user.email },
      include: {
        project: {
          include: { owner: { select: { username: true } } },
        },
      },
    })

    const list = invitations
      .filter((i) => i.expiresAt > new Date())
      .map((i) => ({
        id: i.id,
        token: i.token,
        projectId: i.projectId,
        projectName: i.project.name,
        inviter: i.project.owner.username,
        role: i.role,
      }))

    res.json(list)
  } catch (err) {
    console.error("Pending invitations error:", err)
    res.status(500).json({ message: "Failed to list invitations" })
  }
})

router.get("/:token", async (req, res) => {
  try {
    const invitation = await meta.projectInvitation.findUnique({
      where: { token: req.params.token },
      include: {
        project: { include: { owner: { select: { username: true } } } },
      },
    })

    if (!invitation || invitation.expiresAt < new Date()) {
      return res.status(404).json({ message: "Invitation not found or expired" })
    }

    res.json({
      projectName: invitation.project.name,
      inviter: invitation.project.owner.username,
      role: invitation.role,
    })
  } catch (err) {
    console.error("Get invitation error:", err)
    res.status(500).json({ message: "Failed to get invitation" })
  }
})

router.post("/:token/accept", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })

    const invitation = await meta.projectInvitation.findUnique({
      where: { token: req.params.token },
      include: { project: true },
    })

    if (!invitation || invitation.expiresAt < new Date()) {
      return res.status(404).json({ message: "Invitation not found or expired" })
    }

    if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: "Invitation was sent to a different email" })
    }

    await meta.$transaction([
      meta.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: req.user.id,
          role: invitation.role,
        },
      }),
      meta.projectInvitation.delete({ where: { id: invitation.id } }),
    ])

    res.json({ projectId: invitation.projectId })
  } catch (err) {
    console.error("Accept invitation error:", err)
    res.status(500).json({ message: "Failed to accept invitation" })
  }
})

router.post("/:token/decline", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })

    const invitation = await meta.projectInvitation.findUnique({
      where: { token: req.params.token },
    })

    if (!invitation || invitation.expiresAt < new Date()) {
      return res.status(404).json({ message: "Invitation not found or expired" })
    }

    if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: "Invitation was sent to a different email" })
    }

    await meta.projectInvitation.delete({ where: { id: invitation.id } })
    res.json({ success: true })
  } catch (err) {
    console.error("Decline invitation error:", err)
    res.status(500).json({ message: "Failed to decline invitation" })
  }
})

export default router
