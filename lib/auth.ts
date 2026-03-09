import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import type { User } from "../generated/meta/index.js"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production"

export interface AuthUser {
  id: string
  username: string
  email: string
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch {
    return null
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(" ")[1] || req.cookies?.ufoStudioToken

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." })
  }

  const user = verifyToken(token)
  if (!user) {
    return res.status(401).json({ message: "Access denied" })
  }

  req.user = user
  next()
}

/** For schema/studio routes: bypass auth in development */
export function schemaAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
    return next()
  }
  return authMiddleware(req, res, next)
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(" ")[1] || req.cookies?.ufoStudioToken

  if (token) {
    const user = verifyToken(token)
    if (user) req.user = user
  }
  next()
}
