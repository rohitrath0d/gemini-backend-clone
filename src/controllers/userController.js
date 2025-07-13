import {PrismaClient} from "@prisma/client"

const prisma = new PrismaClient();

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where : {
        id: req.user.userId 
      }});

    if(!user) return res.status(404).json({success: false, error: "User not found!"});
  
    return res.status(200).json({success: true, user });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Error in fetching user!"
    })
  }
};


