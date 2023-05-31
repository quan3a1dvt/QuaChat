import { defineStore } from 'pinia';

const getMessagesGroup = ((msgs) => {
  let messagesGroup = []
  let messageGroup = []
  let currentMsgFrom
  let currentMsgCreateon
  for (let msg of msgs) {
    if (messageGroup.length == 0) {
      messageGroup.push(msg)
      currentMsgFrom = msg.from
      currentMsgCreateon = msg.createon
    }
    else {
      if (msg.type == "evt") {
        messagesGroup.push(messageGroup)
        messageGroup = [msg]
        currentMsgFrom = msg.from
        currentMsgCreateon = msg.createon
      }
      else {
        if (msg.from == currentMsgFrom && ((msg.createon - currentMsgCreateon) / 1000 <= 300) && msg.type != "evt") {
          messageGroup.push(msg)
          currentMsgCreateon = msg.createon
        }
        else {
          messagesGroup.push(messageGroup)
          messageGroup = [msg]
          currentMsgFrom = msg.from
          currentMsgCreateon = msg.createon
        }
      }
    }
  }
  messagesGroup.push(messageGroup)
  return messagesGroup
})



export const useMainStore = defineStore('main', {
  state: () => ({
    counter: 0,
    user: {},
    users: new Map(),
    rooms: new Map(),
    messages: {},
    checkNewMsg: 0,
    scrollEnd: true,
    loaded: false,
    selectedRoomId: -1
  }),
  getters: {
    doubleCount: (state) => state.counter * 2,
    friends: (state) => (new Map(
      Array.from(state.users.values()).filter(user => {
        if (user.isFriend) {
          return true;
        }
        return false;
      }),
    )),
    friendsArr: (state) => (
      Array.from(state.users.values()).filter(user => {
        if (user.isFriend) {
          return true;
        }
        return false;
      })
    ),
    roomsArr: (state) => Array.from(state.rooms.values()),
    
  },

  actions: {
    recieveUser(user) {
      this.user = user
      this.users.set(user.id, user)
    },
    addUsers(users) {
      for (let user of users) {
        this.users.set(user.id, user)
      }
    },
    addRooms(rooms) {
      for (let room of rooms) {
        if (!this.rooms.has(room.id)) {
          if (room.type == 0) {
            if (room.users[0] == this.user.id) {
              room.name = this.users.get(room.users[1]).name
              room.avatar = this.users.get(room.users[1]).avatar
              this.users.get(room.users[1]).roomId = room.id
            }
            else { 
              room.name = this.users.get(room.users[0]).name
              room.avatar = this.users.get(room.users[0]).avatar
              this.users.get(room.users[0]).roomId = room.id
            }
          }
          room.messagesGroup = getMessagesGroup(room.messages)
          this.rooms.set(room.id, room)
        }
      }
    },

    addMessages(msgs) {
      for (let msg of msgs) {
        if (this.rooms.has(msg.to)) {
          let Room = this.rooms.get(msg.to)
          Room.msgCount += 1
          Room.messages.push(msg)
          let messageGroup = Room.messagesGroup[Room.messagesGroup.length - 1]
          let Msg = messageGroup[messageGroup.length - 1]
          if (msg.from == Msg.from && ((msg.createon - Msg.createon) / 1000 <= 300) && msg.type != 'evt')  {
            messageGroup.push(msg)
          }
          else {
            Room.messagesGroup.push([msg])
          }

        }
      }
    },

    recieveMessages(msgs) {
      for (let msg of msgs) {
        if (msg.from != this.user.id) {
          this.addMessages([msg])
        }
        else {
          if (!this.rooms.has(msg.to)) {
            let Msg = this.rooms.get(msg.to).messages.find(obj => {
              return obj.id == msg.id
            })
            Msg.sent = true
            if (Msg.type != 'text') {
              Msg.file = msg.file
            }
          }

        }
      }
    },
    
    setRead(roomId, userId, idx) {
      if (this.rooms.has(roomId)){
        console.log()
        this.rooms.get(roomId).usersProperty[userId].readIdx = idx
      }
    }
  },
});
