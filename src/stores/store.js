import { defineStore } from "pinia";
import piniastore from "./index";

function isStartOfMsgGroup(currentMsg, preMsg) {
  const MAX_TIME_DIFF = 10;
  if (currentMsg.from != preMsg.from) return true;
  if ((currentMsg.createon - preMsg.createon) / 1000 >= MAX_TIME_DIFF) {
    return true;
  } else {
    return false;
  }
}

const ROOM_TYPE = {
  PERSONAL_ROOM: 1,
  ONETOONE_ROOM: 2,
  GROUP_ROOM: 3,
};
const USER_TYPE = {
  USER: 1,
  ADMIN: 2,
  OWNER: 3,
};

const MESSAGE_TYPE = {
  EVENT: 1,
  TEXT: 2,
  VIDEO: 3,
  IMAGE: 4,
  DOCUMENT: 5,
};

const useMainStore = defineStore("main", {
  state: () => ({
    counter: 0,
    loginUser: {},
    users: {},
    rooms: {},
    messages: {},
    checkNewMsg: 0,
    scrollEnd: true,
    loaded: false,
    currentRoomId: null,
    currentRoom: null,
  }),
  getters: {
    doubleCount: (state) => state.counter * 2,
    // friends: (state) => (new Map(
    //   Array.from(state.users.values()).filter(user => {
    //     if (user.isFriend) {
    //       return true;
    //     }
    //     return false;
    //   }),
    // )),
    // friendsArr: (state) => (
    //   Array.from(state.users.values()).filter(user => {
    //     if (user.isFriend) {
    //       return true;
    //     }
    //     return false;
    //   })
    // ),
    // roomsArr: (state) => Array.from(state.rooms.values()),
    mediaMessages: (state) =>
      Object.fromEntries(
        Object.entries(state.rooms[state.currentRoomId].messages).filter(
          ([k, v]) =>
            v.type == MESSAGE_TYPE.IMAGE || v.type == MESSAGE_TYPE.VIDEO
        )
      ),
    sortedRoomsId: (state) => {
      const roomsIdArr = Object.keys(state.rooms);
      console.log("change");
      return roomsIdArr.sort(function (a, b) {
        const msgsIdArrA = Object.keys(state.rooms[a].messages);
        const msgsIdArrB = Object.keys(state.rooms[b].messages);
        return (
          state.rooms[b].messages[msgsIdArrB[msgsIdArrB.length - 1]].createon -
          state.rooms[a].messages[msgsIdArrA[msgsIdArrA.length - 1]].createon
        );
      });
    },
  },

  actions: {
    addLoginUser(user) {
      this.loginUser = user;
      this.users[user.id] = user;
    },
    addUser(user) {
      if (user.id != this.loginUser.id) {
        this.users[user.id] = user;
      }
    },
    addUsers(users) {
      for (let user of users) {
        if (user.id != this.loginUser.id) {
          this.users[user.id] = user;
        }
      }
    },
    addRoom(room) {
      if (!this.rooms.hasOwnProperty(room.id)) {
        const msgsIdArr = Object.keys(room.messages);
        room.loadMsgIdx = msgsIdArr.length - 1;
        msgsIdArr.forEach(function (msgId, index) {
          if (index == 0) room.messages[msgId].isStartMsg = true;
          else {
            const currentMsg = room.messages[msgId];
            const preMsg = room.messages[msgsIdArr[index - 1]];
            room.messages[msgId].isStartMsg = isStartOfMsgGroup(
              currentMsg,
              preMsg
            );
          }
        });
        this.rooms[room.id] = room;
        if (room.type == ROOM_TYPE.ONETOONE_ROOM) {
          for (let userId in room.users) {
            if (userId != this.loginUser.id) {
              this.users[userId].roomId = room.id;
            }
          }
        } else if (room.type == ROOM_TYPE.PERSONAL_ROOM) {
          for (let userId in room.users) {
            this.users[userId].roomId = room.id;
          }
        }
        this.users[this.loginUser.id].rooms[room.id] = { id: room.id };
      }
    },

    addRooms(rooms) {
      for (let room of rooms) {
        this.addRoom(room);
      }
    },

    async deleteRoom(roomId) {
      for (let userId in this.rooms[roomId].users) {
        delete (await this.users[userId].rooms[roomId]);
      }
      delete (await this.rooms[roomId]);
    },

    addFriend(userId) {
      this.loginUser.friends[userId] = { id: userId };
    },

    changeUserStatus(userId, status) {
      this.users[userId].status = status;
    },

    addMessage(msg) {
      let msgsIdArr = Object.keys(this.rooms[msg.to].messages);
      if (msgsIdArr.length == 0) msg.isStartMsg = true;
      else {
        msg.isStartMsg = isStartOfMsgGroup(
          msg,
          this.rooms[msg.to].messages[msgsIdArr[msgsIdArr.length - 1]]
        );
      }
      this.rooms[msg.to].messages[msg.id] = msg;
    },

    // addMessages(msgs) {
    //   for (let msg of msgs) {
    //     if (this.rooms.has(msg.to)) {
    //       let Room = this.rooms.get(msg.to)
    //       Room.msgCount += 1
    //       Room.messages.push(msg)
    //       let messageGroup = Room.messagesGroup[Room.messagesGroup.length - 1]
    //       let Msg = messageGroup[messageGroup.length - 1]
    //       if (msg.from == Msg.from && ((msg.createon - Msg.createon) / 1000 <= 300) && msg.type != 'evt')  {
    //         messageGroup.push(msg)
    //       }
    //       else {
    //         Room.messagesGroup.push([msg])
    //       }

    //     }
    //   }
    // },

    setRead(roomId, userId, idx) {
      this.rooms[roomId].users[userId].readIdx = idx;
    },

    setEmote(roomId, messageId, userId, emote) {
      if (this.rooms[roomId].messages[messageId].emotes == undefined) {
        this.rooms[roomId].messages[messageId].emotes = {};
      }
      this.rooms[roomId].messages[messageId].emotes[[userId, emote]] = [
        userId,
        emote,
      ];
    },

    removeEmote(roomId, messageId, emote) {
      delete this.rooms[roomId].messages[messageId].emotes[emote];
    },
  },
});

const store = useMainStore(piniastore());

export default store;
