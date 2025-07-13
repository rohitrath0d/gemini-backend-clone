import { PrismaClient } from "@prisma/client"
import { sendToGeminiQueue } from "../queues/producer.js";
import { response } from "express";

const prisma = new PrismaClient();


export const createChatroom = async (req, res) => {
  try {

    // user to be authenticated
    // const { id } = req.user.userId;
    const userId = req.user.userId
    console.log(userId);

    if (!userId) return res.status(400).json({ success: false, error: "Unauthorized access!" });

    const { name } = req.body;
    console.log(name);

    if (!name) return res.status(400).json({ success: true, error: "Chatroom name must be provided and can't be empty!" });

    const existingRoom = await prisma.chatroom.findFirst({
      where: {
        name: name,
        userId: req.user.userId
      }
    });

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        error: "Chatroom with the same name already exists!"
      });
    }
    // this was returning chatRoom being undefined, bcoz of the const scopic inside if-else block confining.
    // else {
    //   const chatRoom = await prisma.chatroom.create({
    //     data: {
    //       name,
    //       userId
    //     }
    //   })
    // }

    const chatRoom = await prisma.chatroom.create({
      data: {
        name,
        userId
      }
    });

    // return success response
    res.status(200).json({
      success: true,
      chatRoom
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Error in create chatroom APi "
    })
  }
};


export const getChatroomListByUser = async (req, res) => {
  try {
    // checking if user is authenticated
    const userId = req.user.userId;
    if (!userId) return res.status(400).json({ success: false, error: "Unauthorized access!" });

    // fetch chatrooms from DB
    const chatRoomList = await prisma.chatroom.findMany({
      where: {
        // name: chatroom,
        userId: userId,
        // chatRoom                           // no need to pass anything, just get it with ID
      }
    })

    if (chatRoomList) return res.status(200).json({
      success: true,
      chatRoomList
    })

  } catch (error) {

    console.log(error);
    return res.status(400).json({
      success: false,
      error: "Error in fetching chatroom list"
    })
  }
}


export const getMessageOfChatroom = async (req, res) => {

  try {
    const userId = req.user.userId;
    const { id } = req.params;              // this is chatroomId --> for naming convention matching to the docs.

    console.log("chatRoomId:", id);
    console.log("userId:", userId);

    // if (!chatRoomId || !userId) return res.status(400).json({
    if (!id || !userId) return res.status(400).json({
      success: false,
      error: "Unauthorized access! || or cant access chatRoom"
    })

    // checking chatroom existence with prisma
    // if(id === chatRoomId && userId === req.user.userId)

    const exisitingChatroom = await prisma.chatroom.findFirst({
      where: {
        // id: chatRoomId,
        id: id,
        userId: userId,
      }
    })

    if (!exisitingChatroom) return res.status(400).json({
      success: false,
      error: "Error in finding or locating chatroom"
    })

    const messages = await prisma.message.findMany({
      where: {
        // chatroomId: chatRoomId
        chatroomId: id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      messages
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Error in fetching messages of the chatroom!"
    })
  }
}

export const sendMessageViaGemini = async(req, res) => {
try {

  // first getting chatroom id
  const {id:chatroomId} = req.params;
  console.log(chatroomId, ": chatroom id");

  if(!chatroomId) return res.status(404).json({
    success: false, 
    error: "chatRoom id is not provided || Unauthorized access!"
  });

  // req.user.userId form authMiddleware
  const userId = req.user.userId;
  console.log(userId, ": user's iD");
  if(!userId) return res.status(401).json({
    success: false,
    error: "Unauthorized access"
  });

  // now get content from the user from body
  const {content} = req.body;
  console.log(content, ": message content");
  if(!content) return res.status(404).json({
    success: false,
    error: "Content is required to get response"
  });

  // now have to check that chatroom exists, belongs to that user.
  const validateChatroomExistence = await prisma.chatroom.findFirst({
    where: {
      userId: userId,
      // chatroomId: chatroomId         // chatroomId → id in Prisma
      id: chatroomId
    }
  });
  if(!validateChatroomExistence) return res.status(404).json({
    success: false,
    error: "Chatroom not found in the database. Create new one!"
  });

  const saveMessageToDB = await prisma.message.create({
    data: {
      content,
      userId,
      chatroomId,
      response: null,
    }
  });

  // enqueue to rabbitMQ. Calling sendToGeminiQueue() with:
  // const messageQueue = sendToGeminiQueue({
  const messageQueue = await sendToGeminiQueue({
    messageId: saveMessageToDB.id,
    content,
    chatroomId
  });

  res.status(200).json({
    success: true,
    // message: "Response generated successfully!",
    // userId,
    // chatroomId,
    // content,
    // // response: response

    messages: []

  })
  
} catch (error) {
  console.log(error);
  return res.status(500).json({
    success: false,
    error: "Error in Sending Message via Gemini AI"
  })
}
}