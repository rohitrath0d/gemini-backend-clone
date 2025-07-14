import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
// import { PrismaClient } from '../../generated/prisma/index.js';

import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const signUp = async (req, res) => {

  try {
    const { mobileNumber, name, email, password } = req.body;

    if (!mobileNumber) return res.status(400).json({ success: true, error: "Mobile number is required!!" });

    if (!password) {
      return res.status(400).json({ success: false, error: "Password is required." });
    }

    // indian format
    // const isValid = /^[6-9]\d{9}$/.test(mobileNumber);

    // international format
    const isValid = /^\+?[0-9]{10,15}$/.test(mobileNumber);

    if (!isValid) return res.status(400).json({ success: false, error: "Mobile number format is incorrect!" });

    const hashedPassword = await bcrypt.hash(password, 10);


    // checking if user already exists.
    let user = await prisma.user.findUnique({ where: { mobileNumber } });

    if (user) {
      return res.status(409).json({
        success: false,
        error: "User already exists. Please login using OTP."
      });
    } else {
      user = await prisma.user.create({
        data: {
          mobileNumber,
          name,
          email,
          password: hashedPassword
        },
      });
    }

    // if (user) {
    //   await prisma.user.update({
    //     where: { mobileNumber },
    //     data: { name, email, password: hashedPassword }
    //   })
    // } else {
    //   user = await prisma.user.create({
    //     data: { mobileNumber, name, email, password: hashedPassword },
    //   });
    // }


    res.status(201).json({ success: true, message: "Signup successful!" })
  } catch (error) {
    console.error("[SIGNUP ERROR]", err);
    return res.status(500).json({ success: false, error: "Error in Sign up" });
  }

}


const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) return res.status(400).json({ success: false, error: "Mobile number is required!!" });

    const otp = generateOtp();

    let user = await prisma.user.findUnique({ where: { mobileNumber } });

    if (user) {
      await prisma.user.update({ where: { mobileNumber }, data: { otp } });
    } else {
      user = await prisma.user.create({ data: { mobileNumber, otp } });
    }

    // mock sending OTP by returning it
    res.status(200).json({ success: true, otp });

  } catch (error) {
    console.error("Error while sending Otp", err);
    return res.status(500).json({ success: false, error: "Error in sending Otp" });
  }
};


export const verifyOtp = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) return res.status(400).json({ success: false, error: "Missing fields" });

    const user = await prisma.user.findUnique({ where: { mobileNumber } });
    if (!user || user.otp !== otp) return res.status(401).json({ success: false, error: "Invalid Otp" });

    // Clear OTP
    await prisma.user.update({ where: { mobileNumber }, data: { otp: null } });

    // Create JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ success: true, token })
  } catch (error) {
    console.error("Otp verification error", err);
    return res.status(500).json({ success: false, error: "OTp verification error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {

    const { mobileNumber } = req.body;
    if (!mobileNumber) return res.status(400).json({ success: false, error: "Mobile number is required!" });

    const existingUser = await prisma.user.findUnique({
      where: { mobileNumber }
    });
    if (!existingUser) return res.status(400).json({ success: false, error: "User with mobile number doesn't exists." });

    // generate otp
    const otp = generateOtp();

    // let user = await prisma.user.findUnique({ where: { mobileNumber } });

    // if (user) {
    //   await prisma.user.update({ where: { mobileNumber }, data: { otp } });
    // } else {
    //   user = await prisma.user.create({ data: { mobileNumber, otp } });
    // }

    await prisma.user.update({
      where: { mobileNumber },
      // data: { otp }                        // this stores otp in db after generating and doesn't clean up.
      data: { otp: null }                     // this clean ups/ prevent the otp from strong it to db.
    });

    // mock sending OTP by returning it
    res.status(200).json({
      success: true,
      message: "OTP sent for password reset.",
      otp
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error in password resetting password!" });
  }
}

export const changePassword = async (req, res) => {
  try {
    // allowing only logged in user to change their password:

    // fetch user from DB
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }          // only fetch password
    });

    const { oldPassword, password } = req.body;
    if (!oldPassword || !password) {
      return res.status(400).json({ success: false, error: "Both old and new passwords are required." });
    }

    // 🔐 Why Not Just Use user.password === oldPassword? Because passwords are hashed — never stored as plain text. So must use bcrypt.compare() to validate.
    const isMatchPassword = await bcrypt.compare(oldPassword, user.password);

    const newPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully!',
      password: newPassword
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Password change error!"
    })
  }
}