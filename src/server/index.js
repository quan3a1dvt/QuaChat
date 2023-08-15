const { uniqueNamesGenerator, names } = require("unique-names-generator");
const captureimage = require("./capture-image");
const { v4: uuidv4 } = require('uuid');
const path = require("path");
const cors = require("cors");
const app = require("express")();
app.use(cors());
const bodyParser = require("body-parser");
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
const http = require("http").createServer(app);
const { MongoClient } = require("mongodb");
const multer = require("multer");
const client = new MongoClient("mongodb://localhost:27017");
const jwtVariable = require("../variables/jwt");
const authMethod = require("./auth/auth.methods");
const authMdWare = require("./auth/auth.middlewares");
const randToken = require("rand-token");
const { Console } = require("console");
const database = client.db("local");
const ip = "localhost";
const io = require("socket.io")(http, {
  cors: {
    origins: [`http://${ip}:9000`],
  },
});
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = `./uploads/${req.body.id}`
    fs.mkdirSync(path, { recursive: true })
    cb(null, path)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
});
var upload = multer({ storage: storage });
const connectedUsers = new Map();
var Rooms;
var Users;
var user2socket;
function generateRandomName() {
  return uniqueNamesGenerator({
    dictionaries: [names],
  });
}

async function joinToRoom(socket, roomId) {
  await socket.join(roomId);
}

async function leaveRoom(socket, roomId) {
  await socket.leave(roomId);
}

async function getRoom(roomId, loginUserId) {
  let room = await Rooms.findOne({ id: roomId });
  if (room.type == ROOM_TYPE.ONETOONE_ROOM) {
    for (let userId in room.users) {
      if (userId != loginUserId) {
        const user = await (Users.findOne({id: userId}))
        room.name = user.displayname
        room.avatar = user.avatar
        break
      }
    }
  }
  return room
  // return {
  //   id: room.id,
  //   name: room.name,
  //   type: room.type,
  //   avatar: room.avatar,
  //   users: room.users,
  //   messages: room.messages,
  // };
}



app.get("/", (req, res) => {
  res.send("<h1>Hey Socket.io</h1>");
});

app.post(
  "/uploadfile",
  authMdWare.isAuth,
  upload.single("myfile"),
  async (req, res, next) => {
    const file = req.file;
    if (!file) {
      const error = new Error("Please upload a file");
      error.httpStatusCode = 400;
      return next(error);
    }
    // if (String(req.file.mimetype).startsWith("video")) {
    //   const videoFilePath = `./uploads/${req.body.id}/${req.file.originalname}`;
    //   const exportFilePath = `./uploads/${req.body.id}/`;
    //   captureimage.captureImageFromVideo(videoFilePath, exportFilePath);
    //   console.log(exportFilePath)
    // }
    res.send(file);
  }
);

app.get("/file", (req, res) => {
  // express.js
  res.download(
    `./uploads/${req.query.id}/${req.query.fileName}`
  );
  // var path = require('path')
  // res.sendFile(path.resolve(__dirname+`/../uploads/${req.query.roomId}/${req.query.fileId}/${req.query.fileName}`))
});

app.get("/assets", (req, res) => {
  // express.js
  res.download(
    `../assets/${req.query.fileName}`
  );
  
  // var path = require('path')
  // res.sendFile(path.resolve(__dirname+`/../uploads/${req.query.roomId}/${req.query.fileId}/${req.query.fileName}`))
});

app.post("/login", upload.none(), async (req, res) => {
  const { email, password } = req.body;
  if (await checkUserExist(email)) {
    const user = await Users.findOne({ email: email })
    if (user.password == password) {
      const accessTokenLife =
        process.env.ACCESS_TOKEN_LIFE || jwtVariable.accessTokenLife;
      const accessTokenSecret =
        process.env.ACCESS_TOKEN_SECRET || jwtVariable.accessTokenSecret;
      const dataForAccessToken = {
        id: user.id,
      };
      const accessToken = await authMethod.generateToken(
        dataForAccessToken,
        accessTokenSecret,
        accessTokenLife
      );

      let refreshToken = randToken.generate(jwtVariable.refreshTokenSize); 
      if (!user.refreshToken) {
        await Users.updateOne(
          { id: user.id },
          { $set: { refreshToken: refreshToken } }
        );
      } else {
        refreshToken = user.refreshToken;
      }
      return res.status(200).json({
        accessToken,
        refreshToken,
      });
    } else {
      return res.status(400).json({ err: "Wrong password. Try again" });
    }
  } else {
    return res
      .status(400)
      .json({ err: "User with email doesnot exists. Please signup" });
  }

});

app.post("/register", upload.none(), async (req, res) => {
  const registerInfo = req.body
  if (await checkUserExist(registerInfo)) {
    return res
      .status(400)
      .json({ err: "User with email exists" });
  } 
  else {
    const user = await createUser(registerInfo);
    const selfroom = await createPersonalRoom(user)
    user.rooms[selfroom.id] = {id: selfroom.id}
    await Users.insertOne(user)
    await Rooms.insertOne(selfroom)
    return res.status(200).json({msg: 'User created'});
  }
});
async function checkUserExist(email) {
  let user = await Users.findOne({ email: email });
  if (user == null) {
    return false;
  } else {
    return true;
  }
}

async function generateId() {
  return uuidv4()
}

function generateTimestampId() {
  const timestamp = Date.now(); // Get the current timestamp in milliseconds
  return timestamp.toString(); // Convert timestamp to string
}

const ROOM_TYPE = {
  PERSONAL_ROOM: 1,
  ONETOONE_ROOM: 2,
  GROUP_ROOM: 3
}
const USER_TYPE = {
  USER: 1,
  ADMIN: 2,
  OWNER: 3
}

const MESSAGE_TYPE = {
  EVENT: 1,
  TEXT: 2,
  VIDEO: 3,
  IMAGE: 4,
  DOCUMENT: 5
}

async function createPersonalRoom(user) {
  let roomUsers = {};
  roomUsers[user.id] = {
    id: user.id,
    readIdx: 0, 
    role: USER_TYPE.OWNER 
  };
  const roomId = await generateId()
  initMessage = { 
    id: await generateId(),
    from: user.id,
    to: roomId,
    createon: Date.now(),
    type: MESSAGE_TYPE.EVENT,
    content: "User created",
    reply: null,
  }
  const room = {
    id: roomId,
    name: user.displayname,
    type: ROOM_TYPE.PERSONAL_ROOM,
    avatar: user.avatar,
    owner: user.id,
    createon: Date.now(),
    messages: {
      [initMessage.id]: initMessage
    },
    users: roomUsers
  }
  return room
}

async function createOneToOneRoom(loginUser, user) {
  let roomUsers = {};
  roomUsers[loginUser.id] = {
    id: loginUser.id,
    readIdx: 0, 
    role: USER_TYPE.OWNER 
  };
  roomUsers[user.id] = {
    id: user.id,
    readIdx: -1, 
    role: USER_TYPE.OWNER 
  };
  const roomId = await generateId()
  const room = {
    id: roomId,
    name: user.displayname,
    type: ROOM_TYPE.ONETOONE_ROOM,
    avatar: user.avatar,
    createon: Date.now(),
    messages: {},
    users: roomUsers
  }
  return room
}

async function createGroupRoom(ownerUserId, usersId, roomId, roomName, avatarName) {
  let roomUsers = {};
  for (let userId of usersId) {
    if (userId == ownerUserId) {
      roomUsers[userId] = {
        id: userId,
        readIdx: -1, 
        role: USER_TYPE.OWNER
      };
    }
    else {
      roomUsers[userId] = {
        id: userId,
        readIdx: -1, 
        role: USER_TYPE.USER
      };
    }

  }
  initMessage = { 
    id: await generateId(),
    from: ownerUserId,
    to: roomId,
    createon: Date.now(),
    type: MESSAGE_TYPE.EVENT,
    content: "User created",
    reply: null,
  }
  const room = {
    id: roomId,
    name: roomName,
    type: ROOM_TYPE.GROUP_ROOM,
    avatar: `http://${ip}:3000/file?id=${roomId}&fileName=${avatarName}`,
    createon: Date.now(),
    messages: {
      [initMessage.id]: initMessage
    },
    lastMessage: initMessage,
    users: roomUsers
  }
  return room
}

async function createUser(registerInfo) {
  const userId = await generateId()
  let user = {
    id: userId,
    firstname: registerInfo.firstname,
    lastname: registerInfo.lastname,
    username: registerInfo.username,
    email: registerInfo.email,
    password: registerInfo.password,
    displayname: registerInfo.firstname + " " + registerInfo.lastname,
    avatar: `https://picsum.photos/id/${Math.floor(
      Math.random() * 400
    )}/200/300`,
    friends: {
      [userId]: {id: userId}
    },
    rooms: {},
    socketId: null,
    curRoomId: null,
    status: true,
  };
  return user
}

app.get("/messages", authMdWare.isAuth, async (req, res) => {
  let sidx = Math.max(0, parseInt(req.query.sidx));
  let eidx = parseInt(req.query.eidx);
  let roomId = parseInt(req.query.roomId);
  let msgCount = (await Rooms.findOne({ id: roomId })).msgCount;
  let msgs = [];
  if (sidx == eidx) {
    res.send([]);
  } else {
    for (let msg of (
      await Rooms.findOne(
        { id: roomId },
        { projection: { messages: { $slice: [sidx, eidx - sidx] } } }
      )
    ).messages) {
      msgs.push(msg);
    }
    res.send(msgs);
  }
});
app.get("/video/thumbnail", authMdWare.isAuth, (req, res) => {
  res.download(
    `./uploads/${req.query.roomId}/${req.query.fileId}/${
      path.parse(req.query.fileName).name
    }-thumbnail-320x180-0001.png`
  );
});
app.get("/video", authMdWare.isAuth, (req, res) => {
  const videoPath = `./uploads/${req.query.roomId}/${req.query.fileId}/${req.query.fileName}`;
  const videoStat = fs.statSync(videoPath);
  const fileSize = videoStat.size;
  const videoRange = req.headers.range;
  if (videoRange) {
    const parts = videoRange.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});


async function getUser(userId) {
  var user = await Users.findOne({ id: userId });
  return {
    id: userId,
    displayname: user.displayname,
    avatar: user.avatar,
    status: user.socketId != null,
  };
}

async function getLoginUser(userId) {
  var user = await Users.findOne({ id: userId });
  return user;
}

async function updateUserStatus(userId, status) {
  await Users.updateOne(
    { id: userId },
    { $set: { status: status} }
  );  
}

async function getUsersInRoom(roomId) {
  let users = []
  for (let userId in (await Rooms.findOne({ id: roomId })).users) {
    let user = await getUser(userId);
    users.push(user);
  }
  return users
}

async function getFriends(userId) {
  let users = []
  for (let friendId in (await Users.findOne({ id: userId })).friends) {
    let user = await getUser(friendId);
    users.push(user);
  }
  return users
}

io.on("connection", async (socket) => {
  console.log("user " + socket.user.id + " connected")
  await Users.updateOne({id: socket.user.id}, {$set: {socketId: socket.id}})
  await updateUserStatus(socket.user.id, true)
  socket.on("initData", async () => {
    socket.emit("sendLoginUser", await getLoginUser(socket.user.id));
    let User = await Users.findOne({ id: socket.user.id });
    let rooms = []
    let users = []
    for (let roomId in User.rooms) {
      await joinToRoom(socket, roomId);
      users = users.concat(await getUsersInRoom(roomId))
      let room = await getRoom(roomId, socket.user.id);
      rooms.push(room);
    }
    users = users.concat(await getFriends(socket.user.id))
    await socket.emit("sendUsers", users)
    await socket.emit("sendRooms", rooms);
  })

  // socket.emit("loadComplete");

  socket.on("disconnect", async () => {
    let curRoomId = (await Users.findOne({ id: socket.user.id })).curRoomId;
    if (curRoomId != null) {
      await Rooms.updateOne(
        { id: curRoomId },
        { $set: { "users.$p[socket.user.id].typing": false } }
      );
      await io
        .in(curRoomId)
        .emit(
          "updateRoom",
          curRoomId,
          (
            await Rooms.findOne({ id: curRoomId })
          ).typingUsersId,
          "typingUsersId"
        );
    }

    await Users.updateOne(
      { id: socket.user.id },
      { $set: { curRoomId: null, socketId: null, status: false } }
    );
    const User = await Users.findOne({ id: socket.user.id })
    for (let friendId in User.friends) {
      let socketId = await Users.findOne({ id: friendId }).socketId;
      if (socketId != null) {
        io.to(socketId).emit("friendStatusChange", socket.user.id, false);
      }
    }

    console.log("user " + socket.user.id + " disconnected");
  });



  socket.on("sendMessage", async (msg, callback) => {
    msg.sent = true;
    if (msg.type == MESSAGE_TYPE.DOCUMENT || msg.type == MESSAGE_TYPE.IMAGE || msg.type == MESSAGE_TYPE.VIDEO) {
      msg.file.src = `http://${ip}:3000/file?id=${msg.id}&fileName=${msg.file.name}`;
      if (msg.type == MESSAGE_TYPE.VIDEO) {
        msg.file.thumbnail = `http://${ip}:3000/file?id=${msg.id}&fileName=thumbnail.jpg`
      }
    }
    await Rooms.updateOne({ id: msg.to }, { $set: { [`messages.${msg.id}`]: msg } });
    await Rooms.updateOne({ id: msg.to }, { $set: { lastMessage: msg } });
    await io.in(msg.to).emit("sendMessage", msg);
    callback();
  });
  socket.on("changeRoomAvatar", async (roomId, fileName) => {
    Rooms.updateOne({id: roomId}, {$set: {avatar: `http://${ip}:3000/file?id=${roomId}&fileName=${fileName}`}})
    await io.in(roomId).emit("changeRoomAvatar", roomId, `http://${ip}:3000/file?id=${roomId}&fileName=${fileName}`);
  })

  socket.on("changeRoomName", async (roomId, name) => {
    Rooms.updateOne({id: roomId}, {$set: {name: name}})
    await io.in(roomId).emit("changeRoomName", roomId, name);
  });

  socket.on("newChatUsername", async (username) => {
    const loginUser = await Users.findOne({id: socket.user.id})
    const user = await Users.findOne({ username: username })

    if (user == null) {
      // socket.emit("addUser", null);
    } else {
      socket.emit("sendUser", await getUser(user.id));
      const room = await createOneToOneRoom(loginUser, user) 
      socket.emit("sendTempOneToOneRoom", room)
    }
  });

  socket.on("newChatUserId", async (userId) => {
    const loginUser = await Users.findOne({id: socket.user.id})
    const user = await Users.findOne({ id: userId })
    const room = await createOneToOneRoom(loginUser, user) 
    socket.emit("sendTempOneToOneRoom", room)
  });

  socket.on("createGroup", async (usersId, roomId, roomName, avatarName) => {
    const room = await createGroupRoom(socket.user.id, usersId, roomId, roomName, avatarName) 
    await Rooms.insertOne(room)
    for (let userId of usersId) {  
      let socketId = (await Users.findOne({ id: userId })).socketId;
      if (socketId != null) {
        await joinToRoom(await io.sockets.sockets.get(socketId), room.id);
      }
    }
    for (let userId of usersId) {
      await Users.updateOne({ id: userId }, { $set: { [`rooms.${room.id}`]: {id: room.id} } });
      await io.in(room.id).emit("sendUser", await getUser(userId));
      await io.to(room.id).emit("sendRoom", await getRoom(room.id, socket.user.id));
    }
    
  });

  socket.on("deleteRoom", async (roomId) => {
    
    const room = await Rooms.findOne({id: roomId})
    io.in(room.id).emit("deleteRoom", roomId)
    for (let userId in room.users) {
      await Users.updateOne({id: userId }, {$unset: {[`rooms.${room.id}`]: 1}});
      const socketId = (await Users.findOne({id: userId})).socketId
      if (socketId != null) {
        await leaveRoom(await io.sockets.sockets.get(socketId), room.id);
      }
    }
    await Rooms.deleteOne({id: roomId})

  });

  socket.on("addFriend", async (username) => {
    const loginUser = await Users.findOne({id: socket.user.id})
    const user = await Users.findOne({ username: username })

    if (user == null) {
      // socket.emit("addUser", null);
    } else {
      Users.updateOne({ id: socket.user.id }, { $set: { [`friends.${user.id}`]: {id: user.id} } });
      Users.updateOne({ id: user.id }, { $set: { [`friends.${socket.user.id}`]: {id: socket.user.id} } });
      socket.emit("sendUser", await getUser(user.id));
      socket.emit("addFriend", user.id);
      let socketId = (await Users.findOne({ id: user.id })).socketId;
      if (socketId != null) {
        io.to(socketId).emit("sendUser", await getUser(socket.user.id));
        io.to(socketId).emit("addFriend", socket.user.id);
      }

    }
  });

  socket.on("setupOneToOneRoom", async (room, callback) => {
    await Rooms.insertOne(room)
    await Users.updateOne({ id: socket.user.id }, { $set: { [`rooms.${room.id}`]: {id: room.id} } });    
    for (let userId in room.users) {
      if (userId != socket.user.id) {
        await Users.updateOne({ id: userId }, { $set: { [`rooms.${room.id}`]: {id: room.id} } });
        let socketId = (await Users.findOne({ id: userId })).socketId;
        if (socketId != null) {
          await joinToRoom(await io.sockets.sockets.get(socketId), room.id);
          await io.to(socketId).emit("sendUser", await getUser(socket.user.id));
          await io.to(socketId).emit("sendRoom", await getRoom(room.id, userId));     
        }
      }
    }
    callback()
  })


  socket.on("searchUserId", async (userId) => {
    if ((await Users.findOne({ id: userId })) == null) {
      socket.emit("recieveSearchUserId", null);
    } else {
      Users.updateOne({ id: socket.user.id }, { $set: { [`friends.${userId}`]: {id: userId} } });
      Users.updateOne({ id: userId }, { $set: { [`friends.${socket.user.id}`]: {id: socket.user.id} } });
      let socketId = (await Users.findOne({ id: userId })).socketId;
      if (socketId != null) {
        let user = await getUserPublicData(socket.user.id);
        user.isFriend = true;
        io.to(socketId).emit("addUsers", [user]);
      }
      socket.emit("recieveSearchUserId", await getUserPublicData(userId));
    }
  });


  socket.on("changeRoom", async (roomId) => {
    let curRoomId = (await Users.findOne({ id: socket.user.id })).curRoomId;
    if (curRoomId != undefined) {
      await Rooms.updateOne(
        { id: curRoomId },
        { $pull: { typingUsersId: socket.user.id } }
      );
      await io
        .in(curRoomId)
        .emit(
          "updateRoom",
          curRoomId,
          (
            await Rooms.findOne({ id: curRoomId })
          ).typingUsersId,
          "typingUsersId"
        );
    }
    await Users.updateOne(
      { id: socket.user.id },
      { $set: { curRoomId: roomId } }
    );
    var tmp_usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty;
    if (
      tmp_usersProperty[socket.user.id].readIdx <
      (await Rooms.findOne({ id: roomId })).messages.length - 1
    ) {
      await Rooms.updateOne(
        { id: roomId },
        { $push: { last_message_seen_users: socket.user.id } }
      );
      await io
        .in(roomId)
        .emit(
          "updateRoom",
          roomId,
          (
            await Rooms.findOne({ id: roomId })
          ).last_message_seen_users,
          "last_message_seen_users"
        );
    }
    tmp_usersProperty[socket.user.id].readIdx =
      (await Rooms.findOne({ id: roomId })).messages.length - 1;
    Rooms.updateOne(
      { id: roomId },
      { $set: { usersProperty: tmp_usersProperty } }
    );
  });

  socket.on("setAdmin", async (roomId, userId) => {
    var tmp_usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty;
    tmp_usersProperty[userId].role = "admin";
    await Rooms.updateOne(
      { id: roomId },
      { $set: { usersProperty: tmp_usersProperty } }
    );
    await io.in(roomId).emit("setAdmin", roomId, userId);
  });
  socket.on("removeAdmin", async (roomId, userId) => {
    var tmp_usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty;
    tmp_usersProperty[userId].role = "member";
    await Rooms.updateOne(
      { id: roomId },
      { $set: { usersProperty: tmp_usersProperty } }
    );
    await io.in(roomId).emit("removeAdmin", roomId, userId);
  });
  socket.on("removeMember", async (roomId, userId) => {
    await Users.updateOne({ id: userId }, { $pull: { roomsId: roomId } });
    await Rooms.updateOne({ id: roomId }, { $pull: { usersId: userId } });
    var tmp_usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty;
    delete tmp_usersProperty[userId];
    await Rooms.updateOne(
      { id: roomId },
      { $set: { usersProperty: tmp_usersProperty } }
    );
    await io.in(roomId).emit("removeMember", roomId, userId);
  });

  
  socket.on("setRead", async (roomId, userId, idx) => {
    await Rooms.updateOne({ id: roomId }, { $set: { [`users.${userId}.readIdx`]: idx } });
    await io.in(roomId).emit("setRead", roomId, userId, idx);
  });
  socket.on("typing", async (roomId, typing) => {
    if (typing == true) {
      await Rooms.updateOne(
        { id: roomId },
        { $pull: { typingUsersId: socket.user.id } }
      );
      await Rooms.updateOne(
        { id: roomId },
        { $push: { typingUsersId: socket.user.id } }
      );
    } else {
      await Rooms.updateOne(
        { id: roomId },
        { $pull: { typingUsersId: socket.user.id } }
      );
    }
    await io
      .in(roomId)
      .emit(
        "updateRoom",
        roomId,
        (
          await Rooms.findOne({ id: roomId })
        ).typingUsersId,
        "typingUsersId"
      );
  });

  socket.on("uploadMedia", async (roomId, fileId, fileName) => {
    for (let userId of (await Rooms.findOne({ id: roomId })).users) {
      for (let socket_id of (await user2socket.findOne({ userId: userId }))
        .socketsId) {
        io.to(socket_id).emit("downloadMedia", roomId, fileId, fileName);
      }
    }
  });

  socket.on("addMembers", async (users_id, roomId) => {
    let usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty;
    users_tmp = [];
    for (let userId of users_id) {
      usersProperty[userId] = { readIdx: -1, role: "member" };
      await Users.updateOne({ id: userId }, { $push: { roomsId: roomId } });
      await Rooms.updateOne({ id: roomId }, { $push: { usersId: userId } });
      users_tmp.push(await getUserPublicData(userId));
      for (let socket_id of (await user2socket.findOne({ userId: userId }))
        .socketsId) {
        await joinToRoom(await io.sockets.sockets.get(socket_id), roomId);
      }
    }
    await Rooms.updateOne(
      { id: roomId },
      { $set: { usersProperty: usersProperty } }
    );
    await io.in(roomId).emit("addUsers", users_tmp);
    await io.in(roomId).emit("recieveRoom", await getRoom(roomId));
  });
  socket.on("changeName", (roomId, name) => {
    Rooms.updateOne({ id: roomId }, { $set: { name: name } });
    io.in(roomId).emit("changeName", roomId, name);
  });
});


io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    if (await authMdWare.checkAuthToken(token)) {
      socket.user = {
        id: await authMdWare.getUserId(token)
      }
      next();
    } else {
      next(new Error("not authorized"));
    }
  } catch (e) {
    // if token is invalid, close connection
    console.log("error", e.message);
    return next(new Error(e.message));
  }
});



http.listen(3000, async () => {
  try {
    await client.connect();
    Users = client.db("local").collection("users");
    Rooms = client.db("local").collection("rooms");
    console.log("Listening on port :%s...", http.address().port);
  } catch (e) {
    console.error(e);
  }
});
