import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/user.model';


export interface AuthRequest extends Request {
  user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in the .env file.");
  process.exit(1);
}

const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required in "Bearer <token>" format.' });
  }

  const token = authorization.split(' ')[1] as string;

  try {
  
    const decoded = jwt.verify(token, JWT_SECRET as string);

    if (typeof decoded === 'string' || !(decoded as JwtPayload)._id) {
        return res.status(401).json({ message: 'Invalid token payload.' });
    }
    

    const user = await User.findById((decoded as JwtPayload)._id).select('_id name email');
    
    if (!user) {
      return res.status(401).json({ message: 'User associated with this token no longer exists.' });
    }


    req.user = user;
    next();

  } catch (error) {

    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Request is not authorized. Token may be invalid or expired.' });
  }
};

export default requireAuth;