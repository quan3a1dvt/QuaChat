const { uniqueNamesGenerator, names } = require('unique-names-generator');
const ThumbnailGenerator = require('video-thumbnail-generator').default;
const path = require('path');
const cors = require('cors');
const app = require('express')();
app.use(cors());
const bodyParser = require('body-parser')
const fs = require('fs');
app.use(bodyParser.urlencoded({ extended: true }))
const http = require('http').createServer(app);
const { MongoClient } = require('mongodb');
const multer = require('multer');
const client = new MongoClient('mongodb://localhost:27017')
const jwtVariable = require('../variables/jwt');
const authMethod = require('./auth/auth.methods');
const authMdWare = require('./auth/auth.middlewares');
const randToken = require('rand-token');
const database = client.db('local')
const ip = 'localhost'
const io = require('socket.io')(http, {
  cors: {
    origins: [`http://${ip}:9000`]
  }
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let path = `./uploads/${req.body.roomId}/${req.body.id}`
    fs.mkdirSync(path, { recursive: true })
    cb(null, path)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
var upload = multer({ storage: storage })
const connectedUsers = new Map();
var Rooms;
var Users;
var user2socket;
var users_login
var files;
const randomName = (() => {
  return uniqueNamesGenerator({
    dictionaries: [names],
  });
})

const joinToRoom = ((socket, room) => {
  socket.join(room);
})

const getRoom = (async (roomId, type) => {
  var room = (await Rooms.findOne({ id: roomId }))
  if (type == 'short') {
    return {
      id: room.id,
      name: room.name,
      name_list: room.name_list,
      type: room.type,
      avatar: room.avatar,
      users: room.users,
      msgCount: room.messages.length,
      message_idx: Math.max(room.messages.length - 10, 0),
      messages: room.messages,
      usersProperty: room.usersProperty,
      typingUsersId: room.typingUsersId
    }
  }
  return room
})

const getUser = (async (userId, type) => {
  var user = (await Users.findOne({ id: userId }))
  if (type == 'short') {
    return {
      id: userId,
      name: user.name,
      avatar: user.avatar,
      keyBundle: user.keyBundle,
      status: user.socketId != null
    }
  }
  return user
})

app.get('/', (req, res) => {
  res.send('<h1>Hey Socket.io</h1>');
});

app.post('/uploadfile', authMdWare.isAuth, upload.single('myfile'), async (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
  // if (String(req.file.mimetype).startsWith('video')) {
  //   let tg = new ThumbnailGenerator({
  //     sourcePath: `./uploads/${req.body.roomId}/${req.body.id}/${req.file.originalname}`,
  //     thumbnailPath: `./uploads/${req.body.roomId}/${req.body.id}/`,
  //   });
  //   await tg.generateOneByPercent(10, { size: '320x180' })
  //     .then(console.log);
  //   res.send(file)
  //   return
  // }
  res.send(file)
})

app.get("/file", (req, res) => {
  // express.js
  res.download(`./uploads/${req.query.roomId}/${req.query.fileId}/${req.query.fileName}`)
  // var path = require('path')
  // res.sendFile(path.resolve(__dirname+`/../uploads/${req.query.roomId}/${req.query.fileId}/${req.query.fileName}`))
});


app.get('/login', async (req, res) => {

	const password = req.query.password
  const email = req.query.email
	let user = await users_login.findOne({ email: email })
  if (user != null) {
    if (user.password == password) {
      const accessTokenLife = process.env.ACCESS_TOKEN_LIFE || jwtVariable.accessTokenLife;
      const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || jwtVariable.accessTokenSecret;
      const dataForAccessToken = {
        id: user.id,
      };
      const accessToken = await authMethod.generateToken(
        dataForAccessToken,
        accessTokenSecret,
        accessTokenLife,
      );
      if (!accessToken) {
        return res
          .status(401)
          .send('Đăng nhập không thành công, vui lòng thử lại.');
      }
    
      let refreshToken = randToken.generate(jwtVariable.refreshTokenSize); // tạo 1 refresh token ngẫu nhiên
      if (!user.refreshToken) {
        // Nếu user này chưa có refresh token thì lưu refresh token đó vào database
        await users_login.updateOne({id:user.id}, { $set: { refreshToken: refreshToken }})
      } else {
        // Nếu user này đã có refresh token thì lấy refresh token đó từ database
        refreshToken = user.refreshToken;
      }
    
      return res.status(200).json({
        msg: 'success',
        accessToken,
        refreshToken,
        user,
      });
    }
    else {
      res.send({ msg: 'Wrong email or password' })
    }
  }
  else {
    res.send({ msg: 'Wrong email or password' })
  }



})

app.get('/register', async (req, res) => {
  let email = req.query.email
  let username = req.query.username
  let password = req.query.password
  let user_info = await users_login.findOne({ email: email })
  if (user_info == undefined) {
    let id = await users_login.count() == 0 ? '0' : String(parseInt((await users_login.find().sort({ id: -1 }).limit(1).toArray())[0].id) + 1) || 0
    
    

		const newUser = {
			email: email,
      username: username,
			password: password,
      id: id
		};
    users_login.insertOne(newUser)
    createUser(id, username)
    res.send({ msg: 'success' })

  }
  else {
    res.send({ msg: 'exist' })
  }
})

app.get('/messages', authMdWare.isAuth, async (req, res) => {
  let sidx = Math.max(0, parseInt(req.query.sidx))
  let eidx = parseInt(req.query.eidx)
  let roomId = parseInt(req.query.roomId)
  let msgCount = (await Rooms.findOne({ id: roomId })).msgCount
  let msgs = []
  if (sidx == eidx) {
    res.send([])
  }
  else {
    for (let msg of (await Rooms.findOne({ id: roomId }, { projection: { messages: { $slice: [sidx, eidx - sidx] } } })).messages) {
      msgs.push(msg)
    }
    res.send(msgs)
  }

})
app.get('/video/thumbnail', authMdWare.isAuth, (req, res) => {
  res.download(`./uploads/${req.query.roomId}/${req.query.fileId}/${path.parse(req.query.fileName).name}-thumbnail-320x180-0001.png`)
})
app.get('/video', authMdWare.isAuth, (req, res) => {
  const videoPath = `./uploads/${req.query.roomId}/${req.query.fileId}/${req.query.fileName}`;
  const videoStat = fs.statSync(videoPath);
  const fileSize = videoStat.size;
  const videoRange = req.headers.range;
  if (videoRange) {
    const parts = videoRange.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

io.on('connection', async (socket) => {
  console.log('user ' + socket.user.id + ' connected');
  
  if ((await Users.findOne({ id: socket.user.id })) == null) {
    await createUser(socket.user.id, null)
  }

  Users.updateOne({ id: socket.user.id }, { $set: { status: true, socketId: socket.id } })

  socket.emit('recieveUser', await getUser(socket.user.id, 'long'))

  let User = (await Users.findOne({ id: socket.user.id }))
  let friendsId = User.friendsId
  let users = []
  for (let roomId of User.roomsId) {
    for (let userId of (await Rooms.findOne({ id: roomId })).users) {
      let user = await getUser(userId, 'short')
      if (friendsId.includes(user.id)) {
        user.isFriend = true
      }
      else { user.isFriend = false }
      users.push(user)
      
    }
  }
  await socket.emit('addUsers', users, function(response){
    // socket.emit('requestKeyBundle')
  })

  
  
  let rooms = []
  for (let roomId of User.roomsId) {
    let room = await getRoom(roomId, 'short')
    rooms.push(room)
    
    joinToRoom(socket, roomId)
  }
  await socket.emit("recieveRooms", rooms)

  for (let friendId of User.friendsId) {
    let socketId = await(Users.findOne({ id: friendId })).socketId
    if (socketId != null) {
      io.to(socketId).emit('friendStatusChange', socket.user.id, true)
    }
  }

  socket.emit("loadComplete")

  socket.on('disconnect', async () => {
    let curRoomId = (await Users.findOne({ id: socket.user.id })).curRoomId
    if (curRoomId != null) {
      await Rooms.updateOne({ id: curRoomId }, { $set: { 'usersProperty.$p[socket.user.id].typing' : false} })
      await io.in(curRoomId).emit("updateRoom", curRoomId, (await Rooms.findOne({ id: curRoomId })).typingUsersId, 'typingUsersId')
    }

    await Users.updateOne({ id: socket.user.id }, { $set: { curRoomId: null, socketId: null, status: false } })

    for (let friendId of User.friendsId) {
      let socketId = await(Users.findOne({ id: friendId })).socketId
      if (socketId != null) {
        io.to(socketId).emit('friendStatusChange', socket.user.id, false)
      }
    }

    console.log('user ' + socket.user.id + ' disconnected');
  });

  socket.on("sendKeyBundle", async (KeyBundle, callback) => {
    console.log(KeyBundle)
    await Users.updateOne({ id: socket.user.id }, { $set: { keyBundle: KeyBundle } })
  })

  socket.on("sendMessage", async (msg, callback) => {
    msg.sent = true
    if (msg.type != 'text') {
      msg.file.src = `http://${ip}:3000/file?roomId=${msg.to}&fileId=${msg.file.id}&fileName=${msg.file.name}`
      if (msg.type == 'video') {
        // msg.file.thumbnail = `${ip}:3000/file/thumbnail?roomId=${msg.to}&fileId=${msg.file.id}&fileName=${msg.file.name}`
      }
    }


    await Rooms.updateOne({ id: msg.to }, { $push: { messages: msg } })
    await Rooms.updateOne({ id: msg.to }, { $inc: { msgCount: 1 } })
    await io.in(msg.to).emit("recieveMessages", [msg]);

    callback();
  });

  socket.on("searchUserId", async (userId) => {
    if ((await Users.findOne({ id: userId })) == null) {
      socket.emit('recieveSearchUserId', null)
    }
    else {
      Users.updateOne({ id: socket.user.id }, { $push: { friends: userId } })
      Users.updateOne({ id: userId }, { $push: { friends: socket.user.id } })
      let socketId = (await Users.findOne({ id: userId })).socketId
      if (socketId != null) {
        let user = await getUser(socket.user.id, 'short')
        user.isFriend = true
        io.to(socketId).emit('addUsers', [user])
      }
      socket.emit('recieveSearchUserId', await getUser(userId, 'short', isFriend=true))

    }

  });

  socket.on("addFriend", (id) => {
    if (!(Users.findOne({ id: socket.user.id }).toArray).friends.includes(id)) {
      Users.updateOne({ id: socket.user.id }, { $push: { "friends": id } })
    }
  });

  socket.on("changeRoom", async (roomId) => {
    let curRoomId = (await Users.findOne({ id: socket.user.id })).curRoomId
    if (curRoomId != undefined) {
      await Rooms.updateOne({ id: curRoomId }, { $pull: { typingUsersId: socket.user.id } })
      await io.in(curRoomId).emit("updateRoom", curRoomId, (await Rooms.findOne({ id: curRoomId })).typingUsersId, 'typingUsersId')
    }
    await Users.updateOne({ id: socket.user.id }, { $set: { curRoomId: roomId } })
    var tmp_usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty
    if (tmp_usersProperty[socket.user.id].readIdx < (await Rooms.findOne({ id: roomId })).messages.length - 1) {
      await Rooms.updateOne({ id: roomId }, { $push: { last_message_seen_users: socket.user.id } })
      await io.in(roomId).emit("updateRoom", roomId, (await Rooms.findOne({ id: roomId })).last_message_seen_users, 'last_message_seen_users')
    }
    tmp_usersProperty[socket.user.id].readIdx = (await Rooms.findOne({ id: roomId })).messages.length - 1
    Rooms.updateOne({ id: roomId }, { $set: { usersProperty: tmp_usersProperty } })

  });

  socket.on("setAdmin", async (roomId, userId) => {
    var tmp_usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty
    tmp_usersProperty[userId].role = 'admin'
    await Rooms.updateOne({ id: roomId }, { $set: { usersProperty: tmp_usersProperty } })
    await io.in(roomId).emit("setAdmin", roomId, userId)
  })
  socket.on("removeAdmin", async (roomId, userId) => {
    var tmp_usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty
    tmp_usersProperty[userId].role = 'member'
    await Rooms.updateOne({ id: roomId }, { $set: { usersProperty: tmp_usersProperty } })
    await io.in(roomId).emit("removeAdmin", roomId, userId)
  })
  socket.on("removeMember", async (roomId, userId) => {
    await Users.updateOne({ id: userId }, { $pull: { roomsId: roomId } })
    await Rooms.updateOne({ id: roomId }, { $pull: { usersId: userId } })
    var tmp_usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty
    delete tmp_usersProperty[userId]
    await Rooms.updateOne({ id: roomId }, { $set: { usersProperty: tmp_usersProperty } })
    await io.in(roomId).emit("removeMember", roomId, userId)
  })
  socket.on("setRead", async (roomId, userId, idx) => {
    var tmp_usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty
    tmp_usersProperty[userId].readIdx = idx
    await Rooms.updateOne({ id: roomId }, { $set: { usersProperty: tmp_usersProperty } })
    await io.in(roomId).emit("setRead", roomId, userId, tmp_usersProperty[userId])
  })
  socket.on("typing", async (roomId, typing) => {

    if (typing == true) {
      await Rooms.updateOne({ id: roomId }, { $pull: { typingUsersId: socket.user.id } })
      await Rooms.updateOne({ id: roomId }, { $push: { typingUsersId: socket.user.id } })

    }
    else {
      await Rooms.updateOne({ id: roomId }, { $pull: { typingUsersId: socket.user.id } })
    }
    await io.in(roomId).emit("updateRoom", roomId, (await Rooms.findOne({ id: roomId })).typingUsersId, 'typingUsersId')
  })

  socket.on("uploadMedia", async (roomId, fileId, fileName) => {
    for (let userId of (await Rooms.findOne({ id: roomId })).users) {
      for (let socket_id of (await user2socket.findOne({ userId: userId })).socketsId) {
        io.to(socket_id).emit('downloadMedia', roomId, fileId, fileName)
      }
    }
  })

  socket.on("createRoom", async (roomUsers, inputRoomName, type) => {
    let roomId = Date.now()
    let ownerId = roomUsers[0]
    let roomName = ""
    usersProperty = {}
    for (let i = 0; i < roomUsers.length; i++) {
      roomName = roomName + (await Users.findOne({ id: roomUsers[i] })).name
      if (i < (roomUsers.length - 1)) {
        roomName = roomName + ", "
      }
    }
    for (let userId of roomUsers) {

      usersProperty[userId] = { readIdx: -1, role: 'member' }
    }
    usersProperty[ownerId]['role'] = 'owner'

    await Rooms.insertOne({
      id: roomId,
      name: inputRoomName == '' ? roomName : inputRoomName,
      name_list: roomName,
      type: type,
      avatar: `https://picsum.photos/id/${Math.floor(Math.random() * 400)}/200/300`,
      users: roomUsers,
      owner: ownerId,
      admin: [ownerId],
      msgCount: 1,
      messages: [{
        id: Date.now(),
        from: ownerId,
        to: roomId,
        createon: Date.now(),
        type: 'evt',
        content: type == 0 ? 'Friend added' : (type == 1 ? 'Group created' : 'User created'),
        reply: null
      }],
      usersProperty: usersProperty,
      typingUsersId: [],
      status: false
    })
    for (let userId of roomUsers) {
      await Users.updateOne({ id: userId }, { $push: { roomsId: roomId } })
      let socketId = (await Users.findOne({id: userId})).socketId
      if (socketId != null) {
        let tmp_socket = await io.sockets.sockets.get(socketId)
        joinToRoom(tmp_socket, roomId)
      }
    }
    users = []
    for (let userId of roomUsers) {
      users.push(await getUser(userId, 'short'))
    }
    await io.in(roomId).emit("addUsers", users)
    await io.in(roomId).emit("recieveRooms", [await getRoom(roomId, 'short')])
  });

  socket.on("addMembers", async (users_id, roomId) => {
    let usersProperty = (await Rooms.findOne({ id: roomId })).usersProperty
    users_tmp = []
    for (let userId of users_id) {
      usersProperty[userId] = { readIdx: -1, role: 'member' }
      await Users.updateOne({ id: userId }, { $push: { roomsId: roomId } })
      await Rooms.updateOne({ id: roomId }, { $push: { usersId: userId } })
      users_tmp.push(await getUser(userId, 'short'))
      for (let socket_id of (await user2socket.findOne({ userId: userId })).socketsId) {
        joinToRoom(await io.sockets.sockets.get(socket_id), roomId)
      }
    }
    await Rooms.updateOne({ id: roomId }, { $set: { usersProperty: usersProperty } })
    await io.in(roomId).emit("addUsers", users_tmp)
    await io.in(roomId).emit("recieveRoom", await getRoom(roomId, 'short'))
  });
  socket.on("changeName", (roomId, name) => {
    Rooms.updateOne({ id: roomId }, { $set: { name: name } })
    io.in(roomId).emit("changeName", roomId, name)
  })
});

const createUser = (async (userId, username) => {

  // self room
  let roomId = Date.now()
  let name = randomName()
  if (username != null) {
    name = username
  }
  let user = {
    id: userId,
    name: name,
    avatar: `https://picsum.photos/id/${Math.floor(Math.random() * 400)}/200/300`,
    friendsId: [],
    roomsId: [roomId],
    socketId: null,
    curRoomId: null,
    status: true
  }
  await Users.insertOne(user)
  let usersProperty = {}
  usersProperty[userId] = { readIdx: 0, role: 'owner' }
  await Rooms.insertOne({
    id: roomId,
    name: user.name,
    type: 2,
    avatar: user.avatar,
    users: [userId],
    owner: userId,
    admins: [userId],
    msgCount: 1,
    messages: [{
      id: Date.now(),
      from: userId,
      to: roomId,
      createon: Date.now(),
      type: 'evt',
      content: 'User created',
      reply: null
    }],
    usersProperty: usersProperty,
    typingUsersId: [],
    status: false
  })
})

io.use(async (socket, next) => {
  // fetch token from handshake auth sent by FE
  const token = socket.handshake.auth.token;
  try {
    const userId = await authMdWare.checkAuthToken(token);
    if (userId == false) {
      next(new Error("not authorized"));
    } 
    else {
      // save the user data into socket object, to be used further
      socket.user = {
        id: userId,
      }
      
      next();
    }

  } catch (e) {
    // if token is invalid, close connection
    console.log('error', e.message);
    return next(new Error(e.message));
  }
});


http.listen(3000, async () => {
  try {
    await client.connect();
    Users = client.db("local").collection("users")
    Rooms = client.db("local").collection("rooms")
    user2socket = client.db("local").collection("user2socket")
    users_login = client.db("local").collection("users_login")
    console.log("Listening on port :%s...", http.address().port);
  } catch (e) {
    console.error(e);
  }
});


