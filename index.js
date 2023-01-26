// const express = require("express");
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { StreamChat } from "stream-chat";
// const cors = require("cors");
import { v4 as uuidv4 } from "uuid";

const app = express();
const port = 5000;
//middleware
app.use(express.static("public"));
app.use(cors());
// const cors = require('cors');
// app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());

const api_key = "f4y2g635p78c";
const secret_key =
  "6vwm5kfzjbc6ga5vkcywudjs7brw79h9wnpey8xr9wsh7nr45qh6rej6nfac9xr7";
const serverClient = StreamChat.getInstance(api_key, secret_key);
app.get("/", (req, res) => {
  res.send("tic toe server is running");
});

app.post("/signup", async (req, res) => {
  //code goes here
  try {
    const { yourName, email, userName, password } = req.body;
    const responseForExistingUserName = await serverClient.queryUsers({
      userName: userName,
    });
    const responseForExistingEmail = await serverClient.queryUsers({
      email: email,
    });
    if (responseForExistingEmail.users.length > 0) {
      res.status(401).json("user already exist with this email");
      return;
    } else if (responseForExistingUserName.users.length > 0) {
      res.status(401).json("user name already exist!");
      return;
    } else {
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);
      const token = serverClient.createToken(userId);
      const updateResponse = await serverClient.upsertUsers([
        {
          id: userId,
          role: "user",
          fullName: yourName,
          email: email,
          userName: userName,
          hashedPassword: hashedPassword,
        },
      ]);

      res.json({ yourName, email, userName, userId, hashedPassword, token });
    }
  } catch (error) {
    res.json(error);
  }
});
app.post("/login", async (req, res) => {
  //code goes here
  try {
    const { userName, password } = req.body; //get username and password from frontend
    // console.log(userName);
    const response = await serverClient.queryUsers({ userName: userName });
    // console.log(response.users[0].hashedPassword);
    // const users = await serverClient.queryUsers({ userName: userName }); //it will return an array containing userName available
    // console.log(users.users[0].hashedPassword);
    const token = serverClient.createToken(response.users[0].id); //generate a token against userId
    // console.log(token);
    if (response.users.length <= 0) {
      return res.json({ message: "User not found" });
    }
    const passwordMatched = await bcrypt.compare(
      password,
      response.users[0].hashedPassword
    );
    if (passwordMatched) {
      res.json({
        token,
        yourName: response.users[0].fullName,
        userId: response.users[0].id,
        hashedPassword: response.users[0].hashedPassword,
        email: response.users[0].email,
        userName: response.users[0].userName,
      });
    }
  } catch (error) {
    res.json(error);
  }
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
