export function requireAuth(req, res, next) {
    if (!req.session.subscriberId) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    next();
} 