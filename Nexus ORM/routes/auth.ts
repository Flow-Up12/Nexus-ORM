import { Router } from "express"
import bcrypt from "bcrypt"
import path from "path"
import fs from "fs"
import { meta } from "../../lib/meta.js"
import { signToken, authMiddleware, type AuthenticatedRequest } from "../../lib/auth.js"

const router = Router()
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads"
const AVATAR_DIR = path.join(UPLOAD_DIR, "avatars")

function ensureAvatarDir() {
  if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true })
  }
}

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" })
    }

    const existing = await meta.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })
    if (existing) {
      return res.status(409).json({
        message: existing.username === username ? "Username already taken" : "Email already registered",
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await meta.user.create({
      data: { username, email, passwordHash },
    })

    const token = signToken({ id: user.id, username: user.username, email: user.email })
    res.cookie("ufoStudioToken", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" })
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatarPath: user.avatarPath },
    })
  } catch (err) {
    console.error("Signup error:", err)
    res.status(500).json({ message: "Signup failed" })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, username, emailOrUsername, password } = req.body
    const loginId = email || username || emailOrUsername
    if (!loginId || !password) {
      return res.status(400).json({ message: "Email/username and password are required" })
    }

    const user = await meta.user.findFirst({
      where: {
        OR: [{ email: loginId }, { username: loginId }],
      },
    })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = signToken({ id: user.id, username: user.username, email: user.email })
    res.cookie("ufoStudioToken", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" })
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatarPath: user.avatarPath },
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ message: "Login failed" })
  }
})

router.post("/logout", (_req, res) => {
  res.clearCookie("ufoStudioToken", { path: "/" })
  res.json({ success: true })
})

router.post("/avatar", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })

    const files = (req as any).files
    if (!files?.avatar) {
      return res.status(400).json({ message: "No avatar file uploaded" })
    }

    const file = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar
    const ext = path.extname(file.name) || ".jpg"
    const filename = `${req.user.id}${ext}`

    ensureAvatarDir()
    const destPath = path.join(AVATAR_DIR, filename)
    await file.mv(destPath)

    await meta.user.update({
      where: { id: req.user.id },
      data: { avatarPath: `avatars/${filename}` },
    })

    res.json({ avatarPath: `avatars/${filename}` })
  } catch (err) {
    console.error("Avatar upload error:", err)
    res.status(500).json({ message: "Avatar upload failed" })
  }
})

router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" })

    const user = await meta.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, avatarPath: true },
    })
    if (!user) return res.status(404).json({ message: "User not found" })

    res.json(user)
  } catch (err) {
    console.error("Me error:", err)
    res.status(500).json({ message: "Failed to get user" })
  }
})

export default router
