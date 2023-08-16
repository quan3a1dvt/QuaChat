import { io, protocol } from "socket.io-client";
import axios from "axios";
import cypher from "./cypher.ts";
import store from "../stores/store.js";
const ip = process.env.IP;
const socketport = `http://${ip}:3000`;
let access_token = null;
import { v4 as uuidv4 } from 'uuid';
async function generateId() {
  return uuidv4()
}

class SocketioService {
  constructor() {}

  async setupSocketConnection(token) {
    access_token = token;
    this.socket = io(socketport, {
      auth: {
        token,
      },
      query: {},
    });
    this.socket.on("loadComplete", () => {
      store.loaded = true;
    });
    this.socket.on("sendMessage", async (msg) => {
      store.addMessage(msg);
      if (msg.to == store.currentRoomId) {
        let msgsIdArr = Object.keys(store.rooms[msg.to].messages)
        store.setRead(store.currentRoomId, store.loginUser.id, msgsIdArr.length - 1)
        this.socket.emit("setRead", store.currentRoomId, store.loginUser.id, msgsIdArr.length - 1);
      }
      // for (let msg of msgs) {
      //   if (msg.from == store.user.id) {
      //     let idx = store.rooms.get(msg.to).usersProperty[msg.from].readIdx
      //     idx += 1
      //     store.rooms.get(msg.to).usersProperty[msg.from].readIdx = idx
      //     this.socket.emit('setRead', msg.to, store.user.id, idx)
      //   }
      //   else if (store.scrollEnd == true && msg.to == store.selectedRoomId) {
      //     let roomId = store.selectedRoomId
      //     let userId = store.user.id
      //     let idx = store.rooms.get(store.selectedRoomId).messages_num - 1
      //     store.rooms.get(roomId).usersProperty[userId].readIdx = idx
      //     this.socket.emit('setRead', roomId, userId, idx)
      //   }
      // }
    });

    this.socket.on("updateRoom", (roomId, property, property_id) => {
      if (property_id == "all") {
        let tmp_room = store.rooms.get(roomId);
        // store.rooms.get(roomId) = {...tmp_room, ...property}
      } else {
        store.rooms.get(roomId)[property_id] = property;
      }
    });

    this.socket.on("sendSearchUserId", (user) => {
      if (user != null) {
        if (!store.friends.has(user.id)) {
          user.isFriend = true;
          store.users.set(user.id, user);
        }
        this.createRoom([user.id, store.user.id], "", 0);
      }
    });

    this.socket.on("sendLoginUser", (user) => {
      store.addLoginUser(user);
    });

    this.socket.on("sendUsers", (users) => {
      store.addUsers(users);
    });

    this.socket.on("sendUser", (user) => {
      store.addUser(user);
    });

    this.socket.on("sendRooms", (rooms) => {
      store.addRooms(rooms);
    });

    this.socket.on("sendRoom", (room) => {
      store.addRoom(room);
    });

    this.socket.on("deleteRoom", (roomId) => {
      store.deleteRoom(roomId)
    })

    this.socket.on("changeRoomAvatar", (roomId, avatar) => {
      store.rooms[roomId].avatar = avatar
    })

    this.socket.on("changeRoomName", (roomId, name) => {
      store.rooms[roomId].name = name
    })

    this.socket.on("sendTempOneToOneRoom", (room) => {
      store.currentRoomId = room.id
      store.currentRoom = room
    });

    this.socket.on("addFriend", (userId) => {
      store.addFriend(userId);
    });

    this.socket.on("changeUserStatus", (userId, status) => {
      store.changeUserStatus(userId, status)
    });

    this.socket.on("downloadMedia", (roomId, fileId, fileName) => {
      var config = {
        method: "get",
        maxBodyLength: Infinity,
        responseType: "blob",
        headers: {
          access_token: access_token,
        },
        url: `http://${ip}:3000/downloadfile?roomId=${roomId}&fileId=${fileId}&fileName=${fileName}`,
      };

      axios(config)
        .then(function (response) {
          const reader = new FileReader();
          reader.readAsDataURL(response.data);
          reader.addEventListener("load", () => {
            // localStorage.setItem(`${roomId}/${fileId}`, reader.result);
          });
        })
        .catch(function (error) {
          console.log(error);
        });
    });
    this.socket.on("setRead", (roomId, userId, idx) => {
      if (userId != store.loginUser.id) {
        store.rooms[roomId].users[userId].readIdx = idx;
      }
    });
    this.socket.on("setEmote", (roomId, messageId, userId, emote) => {
      store.setEmote(roomId, messageId, userId, emote)
    });
    this.socket.on("setAdmin", (roomId, userId) => {
      store.rooms.get(roomId).usersProperty[userId].role = "admin";
    });
    this.socket.on("removeAdmin", (roomId, userId) => {
      store.rooms.get(roomId).usersProperty[userId].role = "member";
    });
    this.socket.on("removeMember", async (roomId, userId) => {
      if (store.user.id == userId) {
        store.user.rooms = store.user.rooms.filter((d) => d != roomId);
        store.rooms.delete(roomId);
      } else {
        store.rooms.get(roomId).users = store.rooms
          .get(roomId)
          .users.filter((d) => d != userId);
        delete store.rooms.get(roomId).usersProperty[userId];
      }
    });
    this.socket.on("changeName", (roomId, name) => {
      store.rooms.get(roomId).name = name;
    });
    return this.socket
  }

  getSocket() {
    return this.socket
  }

  updateRoom(roomId, property, property_id) {
    if (property_id == "all") {
      let tmp_room = store.rooms.get(roomId);
      store.rooms.set(roomId, { ...tmp_room, ...property });
    } else {
      store.rooms.get(roomId)[property_id] = property;
    }
  }
  sendMessage(msg) {
    if (msg.to == store.currentRoomId) {
      let msgsIdArr = Object.keys(store.rooms[msg.to].messages)
      store.setRead(store.currentRoomId, store.loginUser.id, msgsIdArr.length - 1)
      this.socket.emit("setRead", store.currentRoomId, store.loginUser.id, msgsIdArr.length - 1);
    }
    this.socket.emit("sendMessage", msg, function (response) {
      console.log("sent");
      msg.sent = true;
    });
  }

  changeRoomAvatar(roomId, file) {
    var data = new FormData();
    data.append("id", roomId);
    data.append("myfile", file);

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `http://${ip}:3000/uploadfile`,
      headers: {
        ...(data.getHeaders
          ? data.getHeaders()
          : { "Content-Type": "multipart/form-data" }),
        access_token: access_token,
      },
      data: data,
    };

    axios(config)
    .then(
      function (response) {
        this.socket.emit("changeRoomAvatar", roomId, file.name)
      }.bind(this)
    )
    .catch(function (error) {
      console.log(error);
    });
  }

  changeRoomName(roomId, name) {
    store.rooms[roomId].name = name
    this.socket.emit("changeRoomName", roomId, name)
  }

  newChat(username) {
    this.socket.emit("newChatUsername", username)
  }

  startChat(userId) {
    console.log(store.users[userId])
    if (store.users[userId].roomId != null) {
      store.currentRoomId = store.users[userId].roomId
    }
    else {
      this.socket.emit("newChatUserId", userId)
    }
  }

  async createGroup(usersId, avatarFile, roomName) {
    const roomId = await generateId()
    var data = new FormData();
    
    data.append("id", roomId);
    data.append("myfile", avatarFile);

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `http://${ip}:3000/uploadfile`,
      headers: {
        ...(data.getHeaders
          ? data.getHeaders()
          : { "Content-Type": "multipart/form-data" }),
        access_token: access_token,
      },
      data: data,
    
    };

    axios(config)
    .then(
      function (response) {
        this.socket.emit("createGroup", usersId, roomId, roomName, avatarFile.name)
      }.bind(this)
    )
    .catch(function (error) {
      console.log(error);
    });

    
  }

  deleteRoom(roomId) {
    delete store.rooms[roomId]
    this.socket.emit("deleteRoom", roomId)
  }

  addFriend(username) {
    this.socket.emit("addFriend", username)
  }

  typing(typing) {
    this.socket.emit("typing", store.selectedRoomId, typing);
  }

  createRoom(users, inputChatName, type) {
    this.socket.emit("createRoom", users, inputChatName, type);
  }

  addMembers(users, roomId) {
    this.socket.emit("addMembers", users, roomId);
  }

  changeName(roomId, name) {
    this.socket.emit("changeName", roomId, name);
  }
  changeRoom() {
    const msgsIdArr = Object.keys(store.rooms[store.currentRoomId].messages)
    store.setRead(store.currentRoomId, store.loginUser.id, msgsIdArr.length - 1)
    this.socket.emit("setRead", store.currentRoomId, store.loginUser.id, msgsIdArr.length - 1);
    // this.socket.emit("changeRoom", store.selectedRoomId);
  }

  setEmote(messageId, emote) {
    this.socket.emit("setEmote", store.currentRoomId, messageId, store.loginUser.id, emote)
  }

  setRead(roomId, userId, idx) {
    store.rooms.get(roomId).usersProperty[userId].readIdx = idx;
    this.socket.emit("setRead", roomId, userId, idx);
  }

  setAdmin(roomId, userId) {
    this.socket.emit("setAdmin", roomId, userId);
  }

  removeAdmin(roomId, userId) {
    this.socket.emit("removeAdmin", roomId, userId);
  }
  removeMember(roomId, userId) {
    this.socket.emit("removeMember", roomId, userId);
  }
  async sendFileMessage(file, msg) {
    var data = new FormData();
    data.append("id", msg.id);
    data.append("myfile", file);

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `http://${ip}:3000/uploadfile`,
      headers: {
        ...(data.getHeaders
          ? data.getHeaders()
          : { "Content-Type": "multipart/form-data" }),
        access_token: access_token,
      },
      data: data,
      // onUploadProgress: function (progressEvent) {
      //   msg.file.progress = parseInt(
      //     Math.round((progressEvent.loaded / progressEvent.total) * 100)
      //   );
      // }.bind(this),
    };

    axios(config)
      .then(
        function (response) {
          this.sendMessage(msg);
        }.bind(this)
      )
      .catch(function (error) {
        console.log(error);
      });
  }

  async uploadVideoThumbnail(file, id) {
    var data = new FormData();
    data.append("id", id);
    data.append("myfile", file);

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `http://${ip}:3000/uploadfile`,
      headers: {
        ...(data.getHeaders
          ? data.getHeaders()
          : { "Content-Type": "multipart/form-data" }),
        access_token: access_token,
      },
      data: data,
      // onUploadProgress: function (progressEvent) {
      //   msg.file.progress = parseInt(
      //     Math.round((progressEvent.loaded / progressEvent.total) * 100)
      //   );
      // }.bind(this),
    };
    axios(config)
    .catch(function (error) {
      console.log(error);
    });
  }

  async uploadAvatar(file, fileId) {
    var data = new FormData();
    data.append("id", fileId);
    data.append("myfile", file);

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `http://${ip}:3000/uploadfile`,
      headers: {
        ...(data.getHeaders
          ? data.getHeaders()
          : { "Content-Type": "multipart/form-data" }),
        access_token: access_token,
      },
      data: data,
    };

    axios(config)
      .then(
        function (response) {
          this.sendMessage(msg);
        }.bind(this)
      )
      .catch(function (error) {
        console.log(error);
      });
  }


  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketioService();
