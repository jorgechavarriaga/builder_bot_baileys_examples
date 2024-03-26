import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
config()

const secretKey = process.env.secretKey

export const generateToken = (username: string) => {
    return jwt.sign({ username }, secretKey, { expiresIn: '1h' })
}

export const verifyToken = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
        res.statusCode = 401
        res.end(JSON.stringify({ message: 'No token provided' }))
        return
    }
    try {
        const decoded = jwt.verify(token, secretKey)
        req.user = decoded
        next()
    } catch (error) {
        res.statusCode = 403
        res.end(JSON.stringify({ message: 'Invalid token' }))
    }
}

export const requireAuth = (req: any, res: any, next: any) => {
    if (!req.headers.authorization) {
        res.statusCode = 401
        res.end(JSON.stringify({ message: 'Unauthorized: Missing token' }))
        return
    }
    next()
}
