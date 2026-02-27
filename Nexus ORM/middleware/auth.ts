import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface AdminRequest extends Request {
    admin?: any;
}

// Simple admin authentication middleware
export const adminAuth = (req: AdminRequest, res: Response, next: NextFunction) => {
    // For development, we'll use a simple token-based auth
    // In production, you'd want proper authentication with roles
    
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
        // For demo purposes, allow access without token in development
        // Check for development environment or if we're running locally
        const isDevelopment = process.env.NODE_ENV === 'development' || 
                             process.env.NODE_ENV === 'dev' || 
                             !process.env.NODE_ENV ||
                             req.get('host')?.includes('localhost')
        
        if (isDevelopment) {
            req.admin = { id: 1, role: 'admin' }
            return next()
        }
        
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        })
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
        req.admin = decoded
        next()
    } catch {
        res.status(400).json({
            success: false,
            message: 'Invalid token.'
        })
    }
}

// Admin login endpoint
export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body
        
        // Simple hardcoded credentials for demo
        // In production, check against database
        if (username === 'admin' && password === 'admin123') {
            const token = jwt.sign(
                { id: 1, username: 'admin', role: 'admin' },
                process.env.JWT_SECRET || 'dev-secret',
                { expiresIn: '24h' }
            )
            
            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: 1,
                    username: 'admin',
                    role: 'admin'
                }
            })
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }
    } catch {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: (error as Error).message
        })
    }
} 