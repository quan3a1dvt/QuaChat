<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  computed,
  watch,
} from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import VueVideoThumbnail from "vue-video-thumbnail";
import "css-doodle";
import EmojiPicker from "vue3-emoji-picker";
import "vue3-emoji-picker/css";
import InfiniteLoading from "v3-infinite-loading";
import dateFormat, { masks } from "dateformat";
import Cookies from "js-cookie";
import { getCssVar } from "quasar";
import SocketioService from "../services/socketio.service.js";
import store from "../stores/store.js";
import { v4 as uuidv4 } from "uuid";
import socketioService from "../services/socketio.service.js";
import { QMediaPlayer } from "@quasar/quasar-app-extension-qmediaplayer";

import Room from "../components/Room/Room.vue"
import ChatWindow from "../components/ChatWindow.vue"
const router = useRouter();
let socketConnected = false;

let messagesEl = ref({});

const addMessageRef = (el, msgId) => {
  messagesEl.value[msgId] = el;
};

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

const USER_TYPE2TEXT = {
  1: "User",
  2: "Admin",
  3: "Owner",
};

const MESSAGE_TYPE = {
  EVENT: 1,
  TEXT: 2,
  VIDEO: 3,
  IMAGE: 4,
  DOCUMENT: 5,
};

const MESSAGE_TYPE2TEXT = {
  1: "Event",
  2: "Text",
  3: "Video",
  4: "Image",
  5: "Document",
};

async function generateId() {
  return uuidv4();
}

function getFullDateTimeFromStamp(stamp) {
  let target = new Date(stamp);
  return dateFormat(target, "dd/m/yyyy h:MM TT");
}

function getShortTimeFormat(stamp) {
  let target = new Date(stamp);
  let now = new Date();
  let nowDayIdx = now.getDate();
  let targetDayIdx = target.getDate();
  if (nowDayIdx - targetDayIdx == 0) {
    return dateFormat(target, "HH:MM");
  } else if (0 < nowDayIdx - targetDayIdx && nowDayIdx - targetDayIdx < 7) {
    return dateFormat(target, "ddd");
  } else {
    return dateFormat(target, "mmm d");
  }
}

function getTimeFromStamp(stamp) {
  let target = new Date(stamp);
  return dateFormat(target, "h:MM TT");
}

function secToMinSec(time) {
  time = Math.floor(time);
  let min = Math.floor(time / 60);
  let sec = time % 60;
  if (sec < 10) {
    return `${min}:0${sec}`;
  } else {
    return `${min}:${sec}`;
  }
}

const convertFileSize = (size) => {
  if (size < 1024) {
    return `${size} B`;
  } else {
    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    } else return `${Math.round(size / (1024 * 1024))} MB`;
  }
};

function getURLFromFile(file) {
  return URL.createObjectURL(file);
}

async function getFileFromUrl(url, name, defaultType = 'image/jpeg'){
  const response = await fetch(url);
  const data = await response.blob();
  return new File([data], name, {
    type: data.type || defaultType,
  });
}

const currentRoomId = computed(() => {
  return store.currentRoomId;
});

const currentRoom = computed(() => {
  if (store.currentRoom != null) {
    return store.currentRoom;
  } else {
    if (currentRoomId.value != null) {
      return store.rooms[currentRoomId.value];
    } else {
      return null;
    }
  }
});

function setCurrentRoomId(id) {
  console.log(id)
  messagesEl.value = [];
  store.currentRoom = null;
  store.currentRoomId = id;
  SocketioService.changeRoom();
}

// left drawer
const leftDrawerOpen = ref(true);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

const isAddFriendDialog = ref(false);
const searchUserName = ref("");
function addFriend() {
  SocketioService.addFriend(searchUserName.value);
  isAddFriendDialog.value = false;
  searchUserName.value = "";
}

const searchUserDisplayname = ref("");

function startChat(userId) {
  SocketioService.startChat(userId);
}

const showNewGroupSelect = ref(false);
const qFileAvatarNewRoom = ref(null);
const inputFileAvatarNewRoom = ref(null);
const avatarNewRoom = ref("http://localhost:3000/assets?fileName=Blank-Avatar.png")
const nameNewRoom = ref("")
const groupSelectedUsersId = ref([]);

function handleUploadAvatarNewRoom() {
  if (inputFileAvatarNewRoom.value != null) {
    avatarNewRoom.value = getURLFromFile(inputFileAvatarNewRoom.value);
  }
}

async function resetNewRoom() {
  groupSelectedUsersId.value = []
  inputFileAvatarNewRoom.value = null;
  avatarNewRoom.value = "http://localhost:3000/assets?fileName=Blank-Avatar.png"
  nameNewRoom.value = ""
}

async function createGroup() {
  if (inputFileAvatarNewRoom.value == null) {
    inputFileAvatarNewRoom.value = await getFileFromUrl(`http://localhost:3000/assets?fileName=Blank-Avatar.png`, 'Blank-Avatar.png');
  }
  let usersId = [store.loginUser.id]
  for (let userId of groupSelectedUsersId.value) {
    usersId.push(userId)
  }
  SocketioService.createGroup(usersId, inputFileAvatarNewRoom.value, nameNewRoom.value)
}

function logout() {
  Cookies.remove("access_token")
  Cookies.remove("refresh_token")
  router.push({
    path: "/login",
  });
}

const searchRoomName = ref("");
function getRoomStatus(roomId) {
  // for (let user in store.rooms[roomId].users) {
  //   if (user.id != store.loginUser.id) {
  //     if (store.users[user.id].status) {
  //       return true;
  //     }
  //   }
  // }
  return false;
}

// top
const roomTab = ref("overview");
const editRoomName = ref("");
const qFileAvatarCurrentRoom = ref(null);

function saveRoomName() {
  SocketioService.changeRoomName(currentRoomId.value, editRoomName.value);
}

const inputFileAvatarCurrentRoom = ref(null);

function changeRoomAvatar() {
  if (inputFileAvatarCurrentRoom.value != null) {
    store.rooms[currentRoomId.value].avatar = getURLFromFile(
      inputFileAvatarCurrentRoom.value
    );
    SocketioService.changeRoomAvatar(
      currentRoomId.value,
      inputFileAvatarCurrentRoom.value
    );
  }
}

function deleteRoom(roomId) {
  SocketioService.deleteRoom(roomId);
}

const mediaDialog = ref(false);
const selectedMsg = ref(null);

// page
const load = async ($state) => {
  console.log("loading...");
  // let room_id = selectedRoomId.value
  // try {
  //   let eidx = rooms.value.get(room_id).message_idx
  //   const response = await axios.get(
  //     `http://chat.quandang.org:3000/messages?room_id=${room_id}&sidx=${eidx-10}&eidx=${eidx}`
  //   )

  //   if (response.data.length == 0){
  //      $state.complete();
  //     }
  //   else {
  //     store.state.rooms.get(room_id).messages = response.data.concat(store.state.rooms.get(room_id).messages)
  //     store.state.rooms.get(room_id).message_idx = store.state.rooms.get(room_id).message_idx - response.data.length
  //     $state.loaded();
  //   }
  // } catch (error) {
  //   $state.error();
  // }
};

function onLoad(index, done) {
  setTimeout(() => {
    store.rooms[currentRoomId.value].loadMsgIdx = Math.max(0, store.rooms[currentRoomId.value].loadMsgIdx - 7)
    done()
  }, 200)
}


//bottom

const qFileInput = ref(null);
const getFile = () => {
  qFileInput.value.$el.click();
};

const inputFiles = ref([]);
const selectedInputFile = ref(null);

const inputMessageText = ref("");
const replyMsg = ref(null);
const onSelectEmoji = (emoji) => {
  inputMessageText.value = inputMessageText.value + emoji.i;
};

async function getTextMsg() {
  return {
    id: await generateId(),
    from: store.loginUser.id,
    to: currentRoomId.value,
    createon: Date.now(),
    sent: false,
    type: MESSAGE_TYPE.TEXT,
    content: inputMessageText.value,
    replyMsg: replyMsg.value != null ? replyMsg.value : null,
  };
}

async function getFileMsg(file) {
  return {
    id: await generateId(),
    from: store.loginUser.id,
    to: currentRoomId.value,
    createon: Date.now(),
    sent: false,
    type: file.type.startsWith("image")
      ? MESSAGE_TYPE.IMAGE
      : file.type.startsWith("video")
      ? MESSAGE_TYPE.VIDEO
      : MESSAGE_TYPE.DOCUMENT,
    file: {
      name: file.name,
      src: getURLFromFile(file),
      type: file.type,
      size: file.size,
      progress: 0,
    },
    reply: replyMsg.value != null ? replyMsg.value : null,
  };
}

async function submitMessage() {
  if (
    currentRoom.value.type == ROOM_TYPE.ONETOONE_ROOM &&
    !store.rooms.hasOwnProperty(currentRoomId.value)
  ) {
    store.rooms[currentRoomId.value] = currentRoom.value;
    const socket = SocketioService.getSocket();
    socket.emit(
      "setupOneToOneRoom",
      currentRoom.value,
      async function (response) {
        if (inputMessageText.value != "") {
          const textMsg = await getTextMsg();
          store.addMessage(textMsg);
          SocketioService.sendMessage(textMsg);
        }
        for (let file of inputFiles.value) {
          const fileMsg = await getFileMsg(file);
          var vid = document.createElement("video");
          var fileURL = getURLFromFile(file);
          vid.src = fileURL;
          vid.ondurationchange = function () {
            fileMsg.file.duration = this.duration;
            SocketioService.sendFileMessage(file, fileMsg);
          };
        }
        inputMessageText.value = "";
        replyMsg.value = null;
        inputFiles.value = [];
      }
    );
  } else {
    if (inputMessageText.value != "") {
      const textMsg = await getTextMsg();
      store.addMessage(textMsg);
      SocketioService.sendMessage(textMsg);
    }
    for (let file of inputFiles.value) {
      const fileMsg = await getFileMsg(file);
      store.addMessage(fileMsg);
      if (fileMsg.type == MESSAGE_TYPE.VIDEO) {
        var vid = document.createElement("video");
        var fileURL = getURLFromFile(file);
        vid.src = fileURL;
        vid.ondurationchange = function () {
          fileMsg.file.duration = this.duration;
          SocketioService.sendFileMessage(file, fileMsg);
        };
      } else {
        SocketioService.sendFileMessage(file, fileMsg);
      }
    }
    inputMessageText.value = "";
    replyMsg.value = null;
    inputFiles.value = [];
  }

  //   files.value = null
  // observeHeight()
  setTimeout(() => {
    scrollToBottom();
  }, 100);
}

const msgMenuOpen = ref(false);

function setReplyMsg(msg) {
  replyMsg.value = JSON.parse(JSON.stringify(msg));
}

const test = () => {
  setTimeout(() => {
    const socket = SocketioService.getSocket();
    socket.emit("initData")
    test();
  }, 200);
};
// test();

const scrollArea = ref(null);
function scrollToBottom() {
  // scrollArea.value.$el.scrollTop = scrollArea.value.$el.scrollHeight + scrollArea.value.$elclientHeight;
  scrollArea.value.setScrollPercentage("vertical", 1.2, 0);
}

function scrollToRead() {
  const readIdx = currentRoom.value.users[store.loginUser.id].readIdx;
  const msgsIdArr = Object.keys(currentRoom.value.messages);
  if (readIdx >= 0) {
    document.getElementById(msgsIdArr[readIdx]).scrollIntoView();
  }
}

const showScrollSticky = computed(() => {
  if (scrollArea.value != null) {
    return scrollArea.value.getScrollPercentage().top < 0.9;
  } else {
    return false;
  }
});

const ldrawer = ref(null);

onMounted(async () => {

  const token = await Cookies.get("access_token")
  if (token == null) {
    router.push({
      path: "/login",
    });
  }
  const socket = await SocketioService.setupSocketConnection(token);
  socket.on("connect", () => {
    socketConnected = true;
    setTimeout(() => {
      socket.emit("initData");
    }, 1000)
    
  });
  watch(currentRoom, (newValue) => {
    if (newValue != null) {
      // nextTick(scrollToRead());
      // nextTick(function () {
      //   document.getElementById("bottom").scrollIntoView()
      // })
      // nextTick(setTimeout(() => {
      //   document.getElementById("bottom").scrollIntoView()
      // }, 10))
    }
  });
});
const style = computed(() => ({
  height: 100 + "vh",
}));
</script>
<template>
  <div class="WAL position-relative" :style=style>
    <q-layout view="lHr lpR lFr" class="WAL__layout" container>
      <q-header elevated>
        <q-toolbar
          style="height: 65px"
          class="bg-white text-black"
          v-if="currentRoomId != null"
        >
          <q-btn
            round
            flat
            icon="keyboard_arrow_left"
            class="WAL__drawer-open q-mr-sm"
            @click="toggleLeftDrawer"
          />

          <q-btn round flat class="q-ml-sm">
            <q-avatar>
              <img :src="currentRoom.avatar" />
            </q-avatar>
            <q-menu @hide="roomTab = 'overview'">
              <q-splitter class="bg-grey-2">
                <template v-slot:before>
                  <q-tabs
                    v-model="roomTab"
                    indicator-color="teal-6"
                    vertical
                    inline-label
                  >
                    <q-tab
                      name="overview"
                      style="justify-content: flex-start"
                      no-caps
                    >
                      <q-icon size="sm" name="mdi-information-outline"></q-icon>
                      <span class="q-ml-sm">Overview</span>
                    </q-tab>
                    <q-tab
                      name="members"
                      style="justify-content: flex-start"
                      no-caps
                      v-if="currentRoom.type == ROOM_TYPE.GROUP_ROOM"
                    >
                      <q-icon
                        size="sm"
                        name="mdi-account-group-outline"
                      ></q-icon>
                      <span class="q-ml-sm">Members</span>
                    </q-tab>
                    <q-tab
                      name="media"
                      style="justify-content: flex-start"
                      no-caps
                    >
                      <q-icon
                        size="sm"
                        name="mdi-image-multiple-outline"
                      ></q-icon>
                      <span class="q-ml-sm">Media</span>
                    </q-tab>
                    <q-tab
                      name="files"
                      style="justify-content: flex-start"
                      no-caps
                    >
                      <q-icon size="sm" name="mdi-file-outline"></q-icon>
                      <span class="q-ml-sm">Files</span>
                    </q-tab>
                  </q-tabs>
                </template>
                <template v-slot:after>
                  <q-tab-panels
                    vertical
                    v-model="roomTab"
                    animated
                    style="width: 340px"
                  >
                    <q-tab-panel class="q-px-lg" name="overview">
                      <q-btn
                        round
                        flat
                        @click="qFileAvatarCurrentRoom.$el.click()"
                        v-if="currentRoom.type == ROOM_TYPE.GROUP_ROOM"
                      >
                        <q-avatar size="80px" class="q-pa-none profilepic">
                          <img
                            class="profilepic__image"
                            :src="currentRoom.avatar"
                          />
                          <q-icon
                            class="profilepic__content"
                            size="20px"
                            color="white"
                            name="mdi-pencil-outline"
                          >
                          </q-icon>
                        </q-avatar>
                      </q-btn>
                      <q-avatar
                        v-if="currentRoom.type != ROOM_TYPE.GROUP_ROOM"
                        size="80px"
                        class="q-pa-none"
                      >
                        <img :src="currentRoom.avatar" />
                      </q-avatar>
                      <q-file
                        ref="qFileAvatarCurrentRoom"
                        style="display: none"
                        v-model="inputFileAvatarCurrentRoom"
                        accept=".jpg, .png"
                        @update:model-value="changeRoomAvatar()"
                      ></q-file>
                      <div class="q-mt-md">
                        <q-btn
                          flat
                          no-caps
                          dense
                          class="btn-hover-remove text-h6 text-weight-medium q-pa-none"
                          @click="editRoomName = currentRoom.name"
                        >
                          {{ currentRoom.name }}
                          <q-popup-edit
                            v-model="editRoomName"
                            v-slot="scope"
                            style="width: 260px"
                          >
                            <q-input
                              class="smaller-input"
                              v-model="scope.value"
                              color="teal-6"
                              dense
                              autofocus
                              @keyup.enter="scope.set"
                            />
                            <div
                              style="display: flex; justify-content: flex-end"
                              class="q-mt-md"
                            >
                              <q-btn
                                dense
                                no-caps
                                unelevated
                                class="full-width shadow-1"
                                label="Cancel"
                                @click.stop.prevent="scope.cancel"
                              />
                              <span class="q-mx-xs"></span>
                              <q-btn
                                dense
                                no-caps
                                unelevated
                                class="full-width shadow-1 text-white bg-teal-6"
                                label="Save"
                                @click.stop.prevent="scope.set"
                                @click="saveRoomName()"
                                :disable="scope.initialValue === scope.value"
                              />
                            </div>
                          </q-popup-edit>
                        </q-btn>
                      </div>

                      <div class="q-mt-sm">
                        <div class="text-weight-light">Created</div>
                        <div>
                          {{ getFullDateTimeFromStamp(currentRoom.createon) }}
                        </div>
                      </div>
                      <q-separator class="q-mt-md" />
                      <q-btn
                        class="text-red text-weight-light full-width shadow-1 q-mt-sm"
                        dense
                        no-caps
                        unelevated
                        v-if="
                          currentRoom.type == ROOM_TYPE.GROUP_ROOM &&
                          currentRoom.users[store.loginUser.id].role >=
                            USER_TYPE.OWNER
                        "
                        @click="deleteRoom(currentRoomId)"
                        v-close-popup
                      >
                        Delete
                      </q-btn>
                      <q-btn
                        class="text-red text-weight-light full-width shadow-1 q-mt-sm"
                        dense
                        no-caps
                        unelevated
                        v-if="currentRoom.type == ROOM_TYPE.GROUP_ROOM"
                        v-close-popup
                      >
                        Exit Group
                      </q-btn>
                    </q-tab-panel>

                    <q-tab-panel name="media" class="q-pr-xs q-pl-lg">
                      <div class="text-h6 text-weight-medium">Media</div>
                      <q-scroll-area style="height: 400px">
                        <div class="row q-col-gutter-sm q-pa-xs">
                          <q-dialog
                            v-model="mediaDialog"
                            v-if="selectedMsg != null"
                          >
                            <div v-if="selectedMsg.type == MESSAGE_TYPE.VIDEO">
                              <video
                                preload="metadata"
                                controls
                                :src="selectedMsg.file.src"
                                type="video/mp4"
                              ></video>
                            </div>
                            <q-img
                              v-if="selectedMsg.type == MESSAGE_TYPE.IMAGE"
                              :src="selectedMsg.file.src"
                            ></q-img>
                          </q-dialog>
                          <template
                            v-for="message in currentRoom.messages"
                            :key="message.id"
                          >
                            <div
                              class="col-4"
                              v-if="
                                message.type == MESSAGE_TYPE.IMAGE ||
                                message.type == MESSAGE_TYPE.VIDEO
                              "
                            >
                              <q-btn
                                class="q-pa-none"
                                style="width: 85px; height:85px; border-radius: 8px"
                                unelevated
                                @click="
                                  selectedMsg = message;
                                  mediaDialog = true;
                                "
                              >
                               
                                <q-img
                                  v-if="message.type == MESSAGE_TYPE.IMAGE"
                                  style="width: 85px; border-radius: 8px"
                                  :src="message.file.src"
                                  :ratio="1"
                                />

                                <video
                                  v-if="message.type == MESSAGE_TYPE.VIDEO"
                                  style="position: absolute;
                                          z-index: -1;
                                          top: 0;
                                          left: 0;
                                          width: 100%; 
                                          height: 100%;
                                          object-fit: cover;
                                          border-radius: 8px"
                                  :src="message.file.src"
                                />

                                <div
                                  style="
                                    position: absolute;
                                    display: flex;
                                    align-items: end;
                                    justify-content: center;
                                  "
                                  class="full-width full-height q-mb-sm"
                                  v-if="message.type == MESSAGE_TYPE.VIDEO"
                                >
                                  <q-chip
                                    square
                                    dense
                                    size="md"
                                    color="black"
                                    text-color="white"
                                    icon="videocam"
                                  >
                                    {{ secToMinSec(message.file.duration) }}
                                  </q-chip>
                                </div>
                              </q-btn>
                            </div>
                          </template>
                        </div>
                      </q-scroll-area>
                    </q-tab-panel>

                    <q-tab-panel name="files" class="q-pr-xs q-pl-lg">
                      <div class="text-h6 text-weight-medium">Files</div>
                    </q-tab-panel>

                    <q-tab-panel class="q-px-none" name="members">
                      <div class="text-h6 q-mx-lg">
                        {{
                          `Members (${Object.keys(currentRoom.users).length})`
                        }}
                      </div>
                      <q-input
                        outlined
                        color="teal-6"
                        placeholder="Search"
                        class="q-mb-sm q-mt-md q-mx-lg smaller-input"
                        dense
                        v-model="searchUserDisplayname"
                        autofocus
                      >
                      </q-input>
                      <q-scroll-area class="q-mx-sm" style="height: 300px">
                        <template v-for="user in currentRoom.users">
                          <q-item
                            clickable
                            v-ripple
                            class="q-pl-md new-chat-item"
                            v-if="
                              store.users[user.id].displayname.includes(
                                searchUserDisplayname
                              )
                            "
                            @click="startChat(user.id)"
                            v-close-popup
                          >
                            <q-item-section avatar>
                              <q-avatar>
                                <img :src="store.users[user.id].avatar" />
                              </q-avatar>
                            </q-item-section>

                            <q-item-section>
                              <span>{{
                                `${store.users[user.id].displayname} ${
                                  user.id == store.loginUser.id ? "(You)" : ""
                                }`
                              }}</span>
                              <span
                                v-if="
                                  currentRoom.users[user.id].role >
                                  USER_TYPE.USER
                                "
                                >{{
                                  USER_TYPE2TEXT[
                                    currentRoom.users[user.id].role
                                  ]
                                }}</span
                              >
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-scroll-area>
                    </q-tab-panel>
                  </q-tab-panels>
                </template>
              </q-splitter>
            </q-menu>
          </q-btn>
          <div class="q-pl-md">
            <div class="text-body2 text-weight-medium">
              {{ currentRoom.name }}
            </div>
            <div v-if="currentRoom.type == ROOM_TYPE.GROUP_ROOM">
              <template v-for="user in currentRoom.users">
                <span class="text-body2" v-if="user.id != store.loginUser.id">
                  {{ `${store.users[user.id].displayname}, ` }}
                </span>
              </template>
            </div>
          </div>
          <q-space />

          <q-btn round flat icon="search" />
        </q-toolbar>
      </q-header>

      <q-drawer
        ref="ldrawer"
        v-model="leftDrawerOpen"
        width=420
        show-if-above
        bordered
        class="full-width"
        :breakpoint="690"
      >
        <q-toolbar class="bg-white">

          <!-- <q-btn round flat icon="mdi-message-plus-outline">

          </q-btn> -->
          <q-dialog v-model="isAddFriendDialog" @hide="searchUserName = '';">
            <q-card style="min-width: 350px">
              <q-card-section>
                <div class="text-h6">Add Friend</div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <q-input
                  color="teal-6"
                  placeholder="Enter username"
                  dense
                  v-model="searchUserName"
                  autofocus
                  @keyup.enter="
                    isAddFriendDialog = false;
                    addFriend();
                  "
                />
              </q-card-section>

              <q-card-actions align="right" class="text-teal-6">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn flat label="Add" v-close-popup @click="addFriend()" />
              </q-card-actions>
            </q-card>
          </q-dialog>
          
          <q-btn
            round
            flat
            icon="close"
            class="WAL__drawer-close"
            @click="toggleLeftDrawer"
          />
          <q-btn 
            round
            flat
            class="q-mx-sm"
            icon="mdi-menu"
          >
            <q-menu auto-close>
              <q-list style="min-width: 150px">
                <q-item clickable>
                  <q-item-section @click="isAddFriendDialog = true">
                  Add Friend</q-item-section
                  >
                </q-item>
                <q-item clickable>
                  <q-item-section>Profile</q-item-section>
                </q-item>
                <q-item clickable>
                  <q-item-section>Settings</q-item-section>
                </q-item>
                <q-item clickable @click="logout()">
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          
          <q-input rounded outlined dense class="WAL__field full-width" bg-color="white" v-model="searchRoomName" placeholder="Search">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </q-toolbar>

        <div class="q-px-sm bg-white" style="height:92%">
          <q-scroll-area style="height:100%">
           
            <q-list>
              <template v-for="roomId of store.sortedRoomsId" :key="roomId">
                {{ (room = store.rooms[roomId], null) }}
                  <Room 
                    v-if="room.name.includes(searchRoomName)"
                    :room="room" 
                    :active="currentRoomId == roomId"
                    :login-user-id="store.loginUser.id"
                    :users="store.users"
                    @click="setCurrentRoomId(roomId)"
                  >
                  </Room>

              </template>
            </q-list>
          </q-scroll-area>
          <div
            style="position:absolute;bottom:32px;right:32px"
          >
            <q-btn fab icon="add" color="primary">
              <q-menu
                style="min-width: 300px"
                @before-show="
                  showNewGroupSelect = false;
                  resetNewRoom();
                "
                @hide="resetNewRoom()"
              >
                <div v-if="!showNewGroupSelect" class="bg-grey-3 q-px-sm q-py-md">
                  <div>
                    <div class="text-h6 q-mb-sm q-px-md">New Chat</div>
                    <q-input
                      color="teal-6"
                      bg-color="white"
                      placeholder="Search"
                      class="q-mb-md q-pl-md q-pr-sm smaller-input"
                      dense
                      filled
                      v-model="searchUserDisplayname"
                      autofocus
                    >
                      <template v-slot:after>
                        <q-btn
                          class="q-mb-sm"
                          size="md"
                          dense
                          flat
                          icon="search"
                        />
                      </template>
                    </q-input>
                    <q-item
                      clickable
                      v-ripple
                      class="new-chat-item q-mb-sm"
                      @click="showNewGroupSelect = true"
                    >
                      <q-item-section avatar>
                        <q-avatar
                          color="teal"
                          text-color="white"
                          icon="mdi-account-group-outline"
                        />
                      </q-item-section>
                      <q-item-section>New Group</q-item-section>
                    </q-item>
                    <div class="text-subtitle2 text-weight-light q-mb-sm q-px-md">
                      All friends
                    </div>
                  </div>
                  <div>
                    <q-scroll-area style="height: 300px">
                      <template v-for="user in store.loginUser.friends">
                        <q-item
                          clickable
                          v-ripple
                          class="new-chat-item q-mb-sm"
                          v-if="
                            store.users[user.id].displayname.includes(
                              searchUserDisplayname
                            )
                          "
                          @click="startChat(user.id)"
                          v-close-popup
                        >
                          <q-item-section avatar>
                            <q-avatar>
                              <img :src="store.users[user.id].avatar" />
                            </q-avatar>
                          </q-item-section>

                          <q-item-section>{{
                            `${store.users[user.id].displayname} ${
                              user.id == store.loginUser.id ? "(You)" : ""
                            }`
                          }}</q-item-section>
                        </q-item>
                      </template>
                    </q-scroll-area>
                  </div>
                </div>
                <div v-if="showNewGroupSelect">
                  <div
                    :class="{
                      'bg-white q-pt-md q-pb-sm ': true,
                      'bg-grey-2': groupSelectedUsersId.length > 0,
                    }"
                  >
                    <div class="q-mx-md" style="display: flex">
                      <q-btn
                        dense
                        flat
                        icon="mdi-arrow-left"
                        size="md"
                        padding="sm"
                        @click="showNewGroupSelect = false"
                      />
                      <div
                        style="display: flex; align-items: center"
                        class="q-px-sm text-h6"
                      >
                        New Group
                      </div>
                    </div>
                    <div v-if="groupSelectedUsersId.length > 0">
                      <div class="q-mx-md q-mb-sm q-mt-sm" style="display: flex">
                        <q-btn round flat @click="qFileAvatarNewRoom.$el.click()">
                          <q-avatar class="q-pa-none profilepic">
                            <img
                              class="profilepic__image"
                              :src="avatarNewRoom"
                            />
                            <q-icon
                              class="profilepic__content"
                              size="20px"
                              color="white"
                              name="mdi-pencil-outline"
                            ></q-icon>
                          </q-avatar>
                        </q-btn>
                        <q-file
                          ref="qFileAvatarNewRoom"
                          style="display: none"
                          v-model="inputFileAvatarNewRoom"
                          accept=".jpg, .png"
                          @update:model-value="handleUploadAvatarNewRoom()"
                        ></q-file>
                        <div
                          style="display: flex; align-items: center"
                          class="q-ml-md"
                        >
                          <q-input
                            outlined
                            color="teal-6"
                            bg-color="white"
                            placeholder="Group Name"
                            class="smaller-input"
                            dense
                            filled
                            v-model="nameNewRoom"
                          >
                          </q-input>
                        </div>
                      </div>
                      <div class="truncate-chip-labels q-mb-md q-mx-md">
                        <template v-for="(userId, index) in groupSelectedUsersId">
                          <q-chip
                            removable
                            square
                            color="teal"
                            text-color="white"
                            @remove="
                              groupSelectedUsersId.value =
                                groupSelectedUsersId.splice(index, 1)
                            "
                            :label="store.users[userId].displayname"
                          >
                            <q-tooltip>{{
                              store.users[userId].displayname
                            }}</q-tooltip>
                          </q-chip>
                        </template>
                      </div>
                      <div
                        style="display: flex; justify-content: flex-end"
                        class="q-px-sm"
                      >
                        <q-btn
                          class="full-width bg-white shadow-1"
                          dense
                          no-caps
                          unelevated
                          @click="groupSelectedUsersId = []"
                        >
                          Cancel
                        </q-btn>
                        <span class="q-mx-xs"></span>
                        <q-btn
                          class="bg-teal-6 text-white full-width shadow-1"
                          dense
                          no-caps
                          unelevated
                          v-close-popup
                          @click="createGroup()"
                        >
                          Create
                        </q-btn>
                      </div>
                    </div>
                  </div>

                  <div class="bg-white q-px-sm q-pb-md">
                    <q-input
                      outlined
                      color="teal-6"
                      bg-color="grey-3"
                      placeholder="Search"
                      class="q-mb-sm q-pl-md q-pr-md q-mt-md smaller-input"
                      dense
                      filled
                      v-model="searchUserDisplayname"
                      autofocus
                    >
                    </q-input>
                    <div class="text-subtitle2 text-weight-light q-mb-sm q-px-md">
                      All friends
                    </div>

                    <div>
                      <q-scroll-area style="height: 300px">
                        <template v-for="user in store.loginUser.friends">
                          <q-item
                            clickable
                            v-ripple
                            class="new-chat-item q-mb-sm"
                            v-if="
                              store.users[user.id].displayname.includes(
                                searchUserDisplayname
                              ) && user.id != store.loginUser.id
                            "
                          >
                            <q-item-section avatar>
                              <q-avatar>
                                <img :src="store.users[user.id].avatar" />
                              </q-avatar>
                            </q-item-section>

                            <q-item-section>{{
                              `${store.users[user.id].displayname} ${
                                user.id == store.loginUser.id ? "(You)" : ""
                              }`
                            }}</q-item-section>
                            <q-item-section avatar>
                              <q-checkbox
                                v-model="groupSelectedUsersId"
                                color="teal-6"
                                :val="user.id"
                              />
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-scroll-area>
                    </div>
                  </div>
                </div>
              </q-menu>
            </q-btn>
          </div>
        </div>

      </q-drawer>
      <q-page-container class="bg-grey-2" style="z-index: 2">
        <q-page style="height: 1px">
          <q-scroll-area
            class="page-chat fit justify-center"
            v-if="currentRoom != null"
            ref="scrollArea"
          >
            <div style="visibility: hidden">test</div>
            <!-- <InfiniteLoading @infinite="load" /> -->
            <chat-window
              :messages="currentRoom.messages"
              :read-idx="currentRoom.users[store.loginUser.id].readIdx"
              :login-user-id="store.loginUser.id"
              @reply="(message) => setReplyMsg(message)"
            />
          </q-scroll-area>
          <q-page-sticky
            v-if="showScrollSticky"
            position="bottom"
            :offset="[0, 18]"
          >
            <q-btn
              round
              color="teal-6"
              icon="arrow_forward"
              class="rotate-90"
              @click="scrollToBottom()"
            />
          </q-page-sticky>
        </q-page>
      </q-page-container>

      <q-footer class="bg-white">
        <q-toolbar v-if="replyMsg != null">
          <q-btn
            style="visibility: hidden"
            flat
            icon="mdi-emoticon-outline"
          ></q-btn>
          <q-btn
            style="visibility: hidden"
            flat
            icon="mdi-emoticon-outline"
          ></q-btn>
          <div
            class="cursor-pointer full-width bg-grey-3 text-black q-mt-sm q-mr-sm reply-box"
            v-if="replyMsg != null"
            style="display: flex; justify-items: center"
          >
            <div class="q-my-xs q-ml-md">
              <q-icon name="mdi-reply" />
              Replying to
              <span class="text-bold">{{
                replyMsg.from == store.loginUser.id
                  ? "Yourself"
                  : store.users[replyMsg.from].displayname
              }}</span>
              <div>
                {{
                  replyMsg.type == MESSAGE_TYPE.TEXT
                    ? replyMsg.content
                    : MESSAGE_TYPE2TEXT[replyMsg.type]
                }}
              </div>
            </div>
            <q-space />
            <q-btn
              flat
              style="border-radius: 8px"
              icon="mdi-window-close"
              @click="replyMsg = null"
            ></q-btn>
          </div>

          <!-- <img src="https://img.vn/uploads/thuvien/singa-png-20220719150401Tdj1WAJFQr.png"/> -->
        </q-toolbar>
        <q-toolbar class="text-black row q-py-sm" v-if="currentRoomId != null">
          <q-btn flat icon="mdi-emoticon-outline">
            <q-menu>
              <div>
                <EmojiPicker :native="true" @select="onSelectEmoji" />
              </div>
            </q-menu>
          </q-btn>
          <q-file
            ref="qFileInput"
            style="display: none"
            v-model="inputFiles"
            append
            multiple
          ></q-file>
          <q-btn flat icon="mdi-paperclip" class="q-mr-sm">
            <q-menu
              @before-show="
                inputFiles = [];
                selectedInputFile = null;
              "
            >
              <div
                style="
                  min-height: 360px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
              >
                <img
                  style="max-height: 350px"
                  v-if="
                    selectedInputFile != null &&
                    selectedInputFile.type.startsWith('image')
                  "
                  :src="getURLFromFile(selectedInputFile)"
                />
                <video
                  style="max-height: 350px"
                  v-if="
                    selectedInputFile != null &&
                    selectedInputFile.type.startsWith('video')
                  "
                  :src="getURLFromFile(selectedInputFile)"
                  controls
                ></video>
                <div
                  v-if="
                    selectedInputFile != null &&
                    !selectedInputFile.type.startsWith('video') &&
                    !selectedInputFile.type.startsWith('image')
                  "
                >
                  <div class="flex flex-center q-mb-sm">
                    <q-icon size="xl" name="mdi-file-outline"></q-icon>
                  </div>

                  <div class="flex flex-center q-mb-xs">
                    {{ selectedInputFile.name }}
                  </div>
                  <div class="flex flex-center">
                    <span>{{
                      `${convertFileSize(selectedInputFile.size)}, ${
                        selectedInputFile.type
                      }`
                    }}</span>
                  </div>
                </div>
              </div>
              <div style="display: flex" class="bg-grey-3">
                <div style="padding-top: 12px; padding-bottom: 3px">
                  <q-scroll-area
                    style="width: 400px"
                    class="flex full-height"
                    :thumb-style="{ height: '6px' }"
                  >
                    <div style="display: flex">
                      <template v-for="(file, index) of inputFiles">
                        <q-btn
                          dense
                          class="q-mx-xs q-pa-none"
                          :style="`border-radius: 0.6;${
                            selectedInputFile == null
                              ? 'opacity: 0.5'
                              : file.__key != selectedInputFile.__key
                              ? 'opacity: 0.5;'
                              : ''
                          }`"
                          unelevated
                          @click="selectedInputFile = file"
                        >
                          <img
                            v-if="file.type.startsWith('image')"
                            style="
                              height: 44px;
                              width: 44px;
                              border-radius: 6px;
                            "
                            :src="getURLFromFile(file)"
                          />
                          <video
                            style="
                              height: 44px;
                              width: 44px;
                              border-radius: 6px;
                            "
                            v-if="file.type.startsWith('video')"
                            :src="getURLFromFile(file)"
                          ></video>
                          <q-icon
                            style="
                              height: 44px;
                              width: 44px;
                              border-radius: 6px;
                            "
                            v-if="
                              !file.type.startsWith('video') &&
                              !file.type.startsWith('image')
                            "
                            name="mdi-file-outline"
                          ></q-icon>
                        </q-btn>
                      </template>
                    </div>
                  </q-scroll-area>
                </div>
                <div style="padding: 12px">
                  <q-btn
                    style="height: 44px; width: 44px"
                    icon="mdi-plus"
                    @click="getFile"
                  >
                  </q-btn>
                  <q-btn
                    class="q-ml-sm"
                    style="height: 44px; width: 44px"
                    color="teal-6"
                    v-close-popup
                    @click="submitMessage()"
                  >
                    <q-icon size="16px" name="mdi-send-outline"> </q-icon>
                  </q-btn>
                </div>
              </div>
            </q-menu>
          </q-btn>

          <q-input
            rounded
            borderless
            dense
            bg-color="grey-1"
            class="WAL__fieldMsg full-width"
            v-model="inputMessageText"
            placeholder="Type a message"
            @keydown.enter="submitMessage"
          />

          <q-btn round flat icon="mic" />
        </q-toolbar>
      </q-footer>
    </q-layout>
  </div>
</template>

<style lang="sass">

.WAL
  width: 100%
  height: 100%

  &__layout
    margin: 0 auto
    height: 100%
    width: 100%
    z-index:4000
    max-width: 1680px
    border-style: solid
    border-left-width: 1px 
    border-right-width: 1px 
    border-top-width: 0px 
    border-bottom-width: 0px 
    border-color: #dfe1e5

  &__field.q-field--outlined .q-field__control:before
    border: none
    border-style: solid
    border-width: 1px
    border-color: #dfe1e5

  &__fieldMsg
    .q-field__control:before
        border: none
    .q-field__control
        color: #ffff
  &__card
    border-radius: 1.6em

  .q-drawer--standard
    .WAL__drawer-close
      display: none

@media (max-width: 850px)
  .WAL
    padding: 0
    &__layout
      width: 100%
      border-radius: 0

@media (min-width: 691px)
  .WAL
    &__drawer-open
      display: none
.doodle
  position: absolute
  z-index: 3

.conversation__summary
  margin-top: 4px

.conversation__more
  margin-top: 0!important
  font-size: 1.4rem

.search-field
  .q-field__inner
    .q-field__control
      height:30px
  .q-field__native
    padding-left:8px

  .q-field__append
    height: 30px
    padding-right:5px

.btn-hover-remove .q-focus-helper
  display: none



.smaller-input
  .q-field__inner
    .q-field__control
      height:30px

.truncate-chip-labels > .q-chip
  max-width: 140px

.new-chat-item
  border-radius: 6px
  padding-left:12px
  padding-top:4px
  padding-bottom:4px
.r-drawer
  width: 30%



.parent
  display: grid
  grid-template-columns: auto 10fr 1fr

.dynamic-width-child
  white-space: nowrap
  text-overflow: ellipsis
  overflow: hidden

.fixed-width-child
  white-space: nowrap

.reply-box
  border-radius: 0.7em
  border-left: 6px solid $green-5

.profilepic
  position: relative

.profilepic:hover .profilepic__content
  opacity: 1

.profilepic:hover .profilepic__image
  filter: brightness(50%)


.profilepic__content
  position: absolute
  top: 50%
  left: 50%
  margin-top:-10px
  margin-left:-10px
  opacity: 0


.page-chat
  padding: 0px 16px 0px 16px
  background-color: #F9F9F9
</style>
