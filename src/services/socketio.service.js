import { io, protocol } from 'socket.io-client'
import axios from 'axios';
import {useMainStore} from '../stores/store.js'
import piniastore from '../stores/index';
const store = useMainStore(piniastore())
const ip = 'http://26.38.106.202'
const socketport = `${ip}:3000`
class SocketioService {
  
  constructor() { }

  getStore() {
    return store;
  }

  async setupSocketConnection(userId) {
    this.socket = io(socketport, {
      auth: {
        userId
      },
      query: {
        
      }
    });

    this.socket.on('loadComplete', () => {
        store.loaded = true
    }); 
    this.socket.on('recieveMessages', async (msgs) => {
      store.recieveMessages(msgs)

      for (let msg of msgs) {
        // if (msg.from == store.user.id) {
        //   let idx = store.rooms.get(msg.to).users_property[msg.from].readIdx
        //   idx += 1
        //   store.rooms.get(msg.to).users_property[msg.from].readIdx = idx
        //   this.socket.emit('setRead', msg.to, store.user.id, idx)
        // }
        // else if (store.scrollEnd == true && msg.to == store.selectedRoomId) {
        //   let roomId = store.selectedRoomId
        //   let userId = store.user.id
        //   let idx = store.rooms.get(store.selectedRoomId).messages_num - 1
        //   store.rooms.get(roomId).users_property[userId].readIdx = idx
        //   this.socket.emit('setRead', roomId, userId, idx)
          
        // }
      }     
    });
    
    this.socket.on('updateRoom', (roomId, property, property_id) => {
      if (property_id == 'all') {
        let tmp_room = store.rooms.get(roomId)
        // store.rooms.get(roomId) = {...tmp_room, ...property}
      }
      else {
        store.rooms.get(roomId)[property_id] = property
      }
    })

    this.socket.on('recieveSearchUserId', (user) => {
      if (user != null) {
        if (!store.friends.has(user.id)) {
          user.isFriend = true
          store.users.set(user.id, user)
        }
        this.createRoom([user.id, store.user.id], '', 0)
      }
    });

    this.socket.on('recieveUser', async (user) => {
      store.recieveUser(user)
    });

    this.socket.on("addUsers", (users) => {
      store.addUsers(users);
    });

    this.socket.on("recieveRooms", (rooms) => {
      console.log
      store.addRooms(rooms)
    });

    this.socket.on("friendStatusChange", (friendId, status) => {
      store.friends.get(friendId).status = status
    });


    this.socket.on("downloadMedia", (roomId, fileId, file_name) => {

      var config = {
        method: 'get',
        maxBodyLength: Infinity,
        responseType: 'blob',
        url: `${ip}:3000/downloadfile?roomId=${roomId}&fileId=${fileId}&file_name=${file_name}`,
      };
      
      axios(config)
      .then(function (response) {
        const reader = new FileReader();           
        reader.readAsDataURL(response.data)
        reader.addEventListener('load', () => {
            // localStorage.setItem(`${roomId}/${fileId}`, reader.result);
        });
        
      })
      .catch(function (error) {
        console.log(error);
      });
    })
    this.socket.on("setRead", (roomId, userId, user_property) => {
      store.rooms.get(roomId).users_property[userId] = user_property
    })
    this.socket.on("setAdmin", (roomId, userId) => {
      store.rooms.get(roomId).users_property[userId].role="admin"
    });
    this.socket.on("removeAdmin", (roomId, userId) => {
      store.rooms.get(roomId).users_property[userId].role="member"
    });
    this.socket.on("removeMember", async (roomId, userId) => {
      if (store.user.id == userId) {
        store.user.rooms = store.user.rooms.filter(d => d != roomId)
        store.rooms.delete(roomId)
        
   
      }
      else {
        store.rooms.get(roomId).users = store.rooms.get(roomId).users.filter(d => d != userId)
        delete store.rooms.get(roomId).users_property[userId]
      }
      
      
      
    });
    this.socket.on("changeName", (roomId, name) => {
      store.rooms.get(roomId).name = name
    })
  }
  
  updateRoom(roomId, property, property_id) {
    if (property_id == 'all') {
      let tmp_room = store.rooms.get(roomId)
      store.rooms.set(roomId, {...tmp_room, ...property})
    }
    else {
      store.rooms.get(roomId)[property_id] = property
    }
  }
  sendMessage(msg) {
    this.socket.emit('sendMessage', msg, function (response) {
        console.log(response);
    });
  }

  searchUserId(userId) {
    this.socket.emit('searchUserId', userId)
  }

  typing(typing) {
    this.socket.emit('typing', store.selectedRoomId, typing)
  }

  createRoom(users, inputChatName, type) {
    this.socket.emit('createRoom', users, inputChatName, type)
  }

  addMembers(users, roomId) {
    this.socket.emit('addMembers', users, roomId)
  }

  changeName(roomId, name) {
    this.socket.emit('changeName', roomId, name)
  }
  changeRoom() {
    // if (store.rooms.get(store.selectedRoomId).users_property[store.user.id].readIdx < store.rooms.get(store.selectedRoomId).messages.length - 1) {
    this.setRead(store.selectedRoomId, store.user.id, store.rooms.get(store.selectedRoomId).messages_num - 1)
    this.socket.emit('changeRoom', store.selectedRoomId)
  }
  
  setRead(roomId, userId, idx) {
    store.rooms.get(roomId).users_property[userId].readIdx = idx
    this.socket.emit('setRead', roomId, userId, idx)
  }

  setAdmin(roomId, userId) {
    this.socket.emit('setAdmin', roomId, userId)
  }
  
  

  removeAdmin(roomId, userId) {
    this.socket.emit('removeAdmin', roomId, userId)
  }
  removeMember(roomId, userId) {
    this.socket.emit('removeMember', roomId, userId)
  }
  async upload(file, roomId, fileId, msg) {
    
    // if (String(file.type).startsWith('image')) {
    //   this.socket.emit('uploadMedia',  roomId, fileId, file.name)
    // }
    
    var data = new FormData();
    data.append('roomId', roomId)
    data.append('id', fileId)
    data.append('msg', msg)
    data.append('myfile', file);
    
    var config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${ip}:3000/uploadfile`,
      headers: { 
        ...data.getHeaders ? data.getHeaders() : { 'Content-Type': 'multipart/form-data' }
      },
      data : data,
      onUploadProgress: function( progressEvent ) {
        msg.file.progress = parseInt( Math.round( ( progressEvent.loaded / progressEvent.total ) * 100 ) );
      }.bind(this)
    };
    
    axios(config)
    .then(function (response) {
      this.sendMessage(msg)
    }.bind(this))
    .catch(function (error) {
      console.log(error);
    });
  }
  download(roomId, fileId, file_name) {
    var config = {
      method: 'get',
      responseType: 'blob',
      maxBodyLength: Infinity,
      url: `${ip}:3000/downloadfile?roomId=${roomId}&fileId=${fileId}&file_name=${file_name}`,
    };
    
    axios(config)
    .then(function (response) {
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${file_name}`);
      document.body.appendChild(link);
      link.click();
    })
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