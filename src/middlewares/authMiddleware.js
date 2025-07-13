
import jwt from "jsonwebtoken";


const authMiddleware = async(req, res, next) => {

  const authHeader = req.headers.authorization;
  if(!authHeader?.startsWith('Bearer ')) return res.status(401).json({success: false, error: "Unauthorized access!"});

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({error: 'Invalid or expired token'});
  }
};


export default authMiddleware;