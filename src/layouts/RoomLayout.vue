<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  computed,
  watch
} from 'vue'
import {
  useRoute
} from 'vue-router';
import axios from 'axios'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import InfiniteLoading from 'v3-infinite-loading'
import dateFormat, {
  masks
} from "dateformat";
import Cookies from 'js-cookie'
import {
  getCssVar
} from 'quasar'
import SocketioService from '../services/socketio.service.js';

const route = useRoute()
const store = SocketioService.getStore()
const Id = localStorage.getItem("user_id")
SocketioService.setupSocketConnection(Cookies.get('access_token'));

const currentRoomId = ref(null)

const currentRoom = computed(() => {
  return store.rooms.get(currentRoomId.value)
})

function setCurrentRoomId(id) {
  currentRoomId.value = id
  roomMenuOpen.value = false
  store.selectedRoomId = id
  SocketioService.changeRoom()
  // setTimeout(() => {
  //   scrollToBottom()
  // }, 200);
}

const isAddFriendDialog = ref(false)
const searchUserId = ref('')
const AddFriend = (() => {
  if (store.friends.has(searchUserId.value)) {} else {
    SocketioService.searchUserId(searchUserId.value)
  }
  isAddFriendDialog.value = false
  searchUserId.value = ''

})

// const rooms = computed(() => store.rooms)
// const roomsArr = computed(() => Array.from(store.rooms.values()))
const test = (() => {

  setTimeout(() => {
    if (scrollArea.value != null) {
      console.log(scrollArea.value.getScrollPercentage())
    
    }
    test()
  }, 3000);
})
test()

const getRoomStatus = ((roomId) => {
  for (let userId of store.rooms.get(roomId).users) {
    if (userId != Id) {
      if (store.users.has(userId)) {
        if (store.users.get(userId).status) {
          return true
        }
      }
    }
  }
  return false
})

const getShortTimeFormat = ((stamp) => {
  let target = new Date(stamp)
  let now = new Date()
  let nowDayIdx = parseInt(dateFormat(now, "d"))
  let targetDayIdx = parseInt(dateFormat(target, "d"))
  if (nowDayIdx - targetDayIdx == 0) {
    return dateFormat(target, "HH:MM")
  } else if (0 < nowDayIdx - targetDayIdx && nowDayIdx - targetDayIdx < 7) {
    return dateFormat(target, "ddd")
  } else {
    return dateFormat(target, 'mmm d')
  }
})

const getTimeFromStamp = ((stamp) => {
  let target = new Date(stamp)
  return dateFormat(target, 'h:MM TT')
})

const scrollArea = ref(null)
const scrollToBottom = (() => {
  // scrollArea.value.$el.scrollTop = scrollArea.value.$el.scrollHeight + scrollArea.value.$elclientHeight;
  scrollArea.value.setScrollPercentage('vertical', 1.2, 0)
})

const qFileInput = ref(null)
const getFile = (() => {
  qFileInput.value.$el.click()
})

const inputFiles = ref([])

const inputMessageText = ref('')
const replyMsg = ref(null)
const onSelectEmoji = ((emoji) => {
  inputMessageText.value = inputMessageText.value + emoji.i
})
const submitMessage = (async () => {
  if (inputFiles.value.length > 0) {
    for (let file of inputFiles.value) {
      console.log(file)
      let createon = Date.now()
      let fileId = createon
      let msg = {
        id: fileId,
        from: Id,
        to: currentRoomId.value,
        createon: createon,
        sent: false,
        type: file.type.startsWith('image') ? 'image' : (file.type.startsWith('video') ? 'video' : 'document'),
        file: {
          name: file.name,
          src: URL.createObjectURL(file),
          id: fileId,
          type: file.type,
          size: file.size,
          progress: 0,
        },
        reply: replyMsg.value != null ? replyMsg.value : null
      }
      store.addMessages([msg])
      SocketioService.upload(file, currentRoomId.value, fileId, msg)
    }
  }
  let createon = Date.now()
  let id = createon
  if (inputMessageText.value != "") {
    let msg = {
      id: id,
      from: Id,
      to: currentRoomId.value,
      createon: createon,
      sent: false,
      type: 'text',
      content: inputMessageText.value,
      replyMsg: replyMsg.value != null ? replyMsg.value : null
    }
    store.addMessages([msg])
    SocketioService.sendMessage(msg)
  }

  inputMessageText.value = ''
  replyMsg.value = null
  inputFiles.value = []
  //   files.value = null
  // observeHeight()
  setTimeout(() => {
    scrollToBottom()
  }, 100);

})

const convertFileSize = ((size) => {
  if (size < 1024) {
    return `${size} K`
  }
  else {
    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`
    }
    else return `${Math.round(size / (1024 * 1024))} MB`
  }
})

const msgMenuOpen = ref(false)
const setReplyMsg = ((msg) => {
  replyMsg.value = JSON.parse(JSON.stringify(msg))
})
const leftDrawerOpen = ref(true)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
const search = ref('')
const message = ref('')

const style = computed(() => ({
  height: 100 + 'vh'
}))

const roomMenuOpen = ref(false)
const rightDrawerOpen = ref(false)

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value
}

const thumbStyle = {
  borderRadius: '5px',
  height: '7px',
  opacity: '0.5'
}

const barStyle = {
  borderRadius: '9px',
  height: '7px',
  opacity: '0.2'
}

const ldrawer = ref(null)
const rdrawer = ref(null)
const qlayout = ref(null)

const testprint = (() => {
  console.log('da')
})
const load = async $state => {
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
onMounted(() => {
  watch(currentRoom, (newValue) => {
    if (newValue != null) {
      setTimeout(() => {
        nextTick(scrollToBottom);
      }, 200); // Delay of 1000 milliseconds (1 second)
      
    }
  });

})
</script>
<template>
  <div class="WAL position-relative bg-grey-4" :style="style">
    <q-layout view="lHr lpR lFr" class="WAL__layout shadow-3" container>
      <q-header elevated>
        <q-toolbar class="bg-grey-3 text-black" v-if="currentRoomId != null">
          <q-btn round flat icon="keyboard_arrow_left" class="WAL__drawer-open q-mr-sm" @click="toggleLeftDrawer" />

          <q-btn round flat>
            <q-avatar>
              <img :src="currentRoom.avatar">
            </q-avatar>
          </q-btn>

          <span class="q-subtitle-1 q-pl-md">
            {{ currentRoom.name }}
          </span>

          <q-space />

          <q-btn round flat icon="search" />
          <q-btn round flat>
            <q-icon name="attachment" class="rotate-135" />
          </q-btn>
          <q-btn round flat icon="more_vert" @click="toggleRightDrawer">
          </q-btn>
        </q-toolbar>
      </q-header>

      <q-drawer ref="ldrawer" v-model="leftDrawerOpen" show-if-above bordered :breakpoint="690">
        <q-toolbar class="bg-grey-3">
          <q-avatar class="cursor-pointer">
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
          </q-avatar>
          <q-toolbar-title>Chats</q-toolbar-title>
          <q-space />

          <q-btn round flat icon="mdi-account-plus-outline" @click="isAddFriendDialog=true" />
          <q-dialog v-model="isAddFriendDialog" persistent>
            <q-card style="min-width: 350px">
              <q-card-section>
                <div class="text-h6">Add Friend</div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <q-input color="teal-6" placeholder="Enter a Username" dense v-model="searchUserId" autofocus @keyup.enter="isAddFriendDialog = false;AddFriend();" />
              </q-card-section>

              <q-card-actions align="right" class="text-teal-6">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn flat label="Add Friend" v-close-popup @click="AddFriend()" />
              </q-card-actions>
            </q-card>
          </q-dialog>
          <q-btn round flat icon="more_vert">
            <q-menu auto-close :offset="[110, 8]">
              <q-list style="min-width: 150px">
                <q-item clickable>
                  <q-item-section>New group</q-item-section>
                </q-item>
                <q-item clickable>
                  <q-item-section>Profile</q-item-section>
                </q-item>
                <q-item clickable>
                  <q-item-section>Archived</q-item-section>
                </q-item>
                <q-item clickable>
                  <q-item-section>Favorites</q-item-section>
                </q-item>
                <q-item clickable>
                  <q-item-section>Settings</q-item-section>
                </q-item>
                <q-item clickable>
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <q-btn round flat icon="close" class="WAL__drawer-close" @click="toggleLeftDrawer" />
        </q-toolbar>

        <q-toolbar class="bg-grey-2">
          <q-input rounded outlined dense class="WAL__field full-width" bg-color="white" v-model="search" placeholder="Search or start a new conversation">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </q-toolbar>

        <q-scroll-area style="height: calc(100% - 100px)">
          <q-list>
            <q-item v-for="room in store.roomsArr" :key="room.id" clickable v-ripple @click="setCurrentRoomId(room.id)">
              {{(msgNum=room.messages.length,null) }}
              {{(lastMsg=room.messages[msgNum - 1], unreadNum = room.msgCount - (room.usersProperty[Id].readIdx + 1), null)}}
              <q-item-section avatar>
                <q-avatar>
                  <img v-if="room.type==0 || room.type == 2" :src="room.avatar">
                  <q-badge floating :color="getRoomStatus(room.id) ? 'green' : 'transparent'" rounded />
                </q-avatar>
                <!-- <q-avatar v-if="room.type==1" square>
                                <q-avatar>
                                    <img :src="users.get(room.users[0]).avatar" style="z-index: 2;margin-top:0.95rem;margin-right:-0.2rem;border: 3px solid white;"/>
                                </q-avatar>
                                <q-avatar>
                                    <img :src="users.get(room.users[1]).avatar" style="z-index: 1;margin-bottom:0.8rem;margin-left:-0.8rem;"/>
                                </q-avatar>
                            </q-avatar> -->
              </q-item-section>

              <q-item-section>
                <q-item-label lines="1" class="parent">
                  <div class="dynamic-width-child">
                    {{ room.name }}
                  </div>
                  <q-space />
                  <div :class="{'text-weight-bold text-teal-6' : unreadNum > 0,'fixed-width-child':true}">{{ getShortTimeFormat(lastMsg.createon) }}</div>
                </q-item-label>
                <q-item-label class="conversation__summary parent" caption>
                  <div class="dynamic-width-child">
                    {{ lastMsg.type=='text' ? `${store.users.get(lastMsg.from).id == Id ? 'You' : store.users.get(lastMsg.from).name}: ${lastMsg.content}`: (lastMsg.type =='evt' ?  lastMsg.content : `${store.users.get(lastMsg.from).id == Id ? 'You' : store.users.get(lastMsg.from).name} sent a ${lastMsg.type}`)}}
                  </div>
                  <q-space />
                  <div class="fixed-width-child">
                    <q-badge v-if="unreadNum > 0" color="teal-6" rounded text-color="white" :label="unreadNum" />
                  </div>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-drawer>
      <q-drawer ref="rdrawer" v-if="currentRoomId != null" v-model="rightDrawerOpen" side="right" show-if-above bordered :breakpoint="690" width="400">
        <!-- :width="$q.screen.width > 1200 ? qlayout.$el.clientWidth * 0.3 : $q.screen.width" -->
        <q-toolbar class="bg-grey-3">
          <q-btn round flat icon="close" @click="toggleRightDrawer"></q-btn>
        </q-toolbar>
        <div>
          <q-card class="full-width">
            <q-card-section class="q-pt-lg flex flex-center column">
              <q-avatar size="100px" class="q-mb-sm">
                <img :src="currentRoom.avatar">
              </q-avatar>
              <div class="text-h5">
                {{ currentRoom.name }}
              </div>
            </q-card-section>
          </q-card>
          <q-card class="full-width">

          </q-card>
        </div>

      </q-drawer>
      <q-page-container class="bg-grey-2">
        <q-page style="height: 300px;">
          <q-scroll-area visible=false class="page-chat fit justify-center" v-if="currentRoom != null" ref="scrollArea">
            <InfiniteLoading @infinite="load" />
            <div v-for="(messageGroup, index) in currentRoom.messagesGroup" :key="index">
              <div :style="message.from == Id ? 'display:flex;justify-content: end' : ''" v-for="(message, idx) in messageGroup" :key="idx">
                <q-chat-message style="border-radius: 25px;" :class="{'round-border':true,'remove-triagle': message.from == Id ? true : (idx < messageGroup.length-1)}" @dblclick="msgMenuOpen = true" :sent="messageGroup[0].from == Id" :bg-color="messageGroup[0].from == Id ? 'green-2' : 'white'">
                  <template v-slot:avatar>
                    <img :style="{visibility: idx < messageGroup.length-1 ? 'hidden' : 'visible', display: messageGroup[0].from == Id ? 'none' : ''}"
                      class="q-message-avatar q-message-avatar--received"
                      :src="messageGroup[0].from != Id ? store.users.get(messageGroup[0].from).avatar : store.users.get(Id).avatar"
                    >
                  </template>
                    <div>
                      <q-menu touch-position context-menu>
                        <q-list style="min-width: 100px">
                          <q-item clickable v-close-popup @click="setReplyMsg(message)">
                            <q-item-section>
                              <q-icon name="mdi-reply" size="sm" />
                            </q-item-section>
                            <q-item-section class="q-ma-none">Reply</q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                      
                      <div class="bg-grey-4 q-mb-sm q-px-sm q-py-xs reply-box" v-if="message.replyMsg != null">
                        <span class="text-bold text-green-6">{{ message.replyMsg.from == Id ? 'You' : store.users.get(replyMsg.from).name}}</span>
                        <div v-if="message.replyMsg.type == 'text'">
                          {{ message.replyMsg.content }}
                        </div>
                        <div v-if="message.replyMsg.type != 'text'">
                          <span class="text-capitalize">{{message.replyMsg.type}}</span>

                        </div>
                      </div>
                  
                      <div v-if="message.type == 'text'" >{{ message.content }}</div>

                      <div v-if="message.type == 'image'">
                        <img style="border-radius:10px;max-height: 25vh; max-width: 35vh;" :src="message.file.src" />
                        <!-- <q-img fit='contain' :src="message.file.src" height="180px" width="320px"> -->

                        <!-- </q-img> -->
                      </div>
                      <div v-if="message.type == 'video'">
                        <video style="border-radius:10px;" controls width="320">
                          <source :src="message.file.src" type="video/mp4">
                        </video>
                      </div>
                      <div v-if="message.type == 'document'">
                        <q-item @click="SocketioService.download(currentRoomId, message.file.id, message.file.name)" clickable v-ripple class="q-px-sm bg-blue-grey-1 q-mb-xs" style="border-radius: 0.7rem;" >
                          <q-item-section avatar top>
                            <q-avatar icon="mdi-file" color="teal" text-color="white"  />
                          </q-item-section>

                          <q-item-section>
                            <q-item-label lines="1">{{message.file.name}}</q-item-label>
                            <q-item-label caption>{{message.file.name.split('.').pop().toUpperCase()}} • {{convertFileSize(message.file.size)}}</q-item-label>
                          </q-item-section>
                        </q-item>
                      </div>
                      <div :class="{'q-mt-sm':message.type == 'text', 'q-ml-lg':true}">
                        <div style="display: flex;justify-content: end;">
                          <div style="display:block;">
                            <span style="opacity: 0.6;font-size: x-small;">{{getTimeFromStamp(message.createon)}}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                </q-chat-message>
                <div v-if="message.from == Id" class='q-mb-sm' style="display: flex;align-items: end;">
                  
                  <span v-if='message.from == Id' class="q-ml-xs" :style="(message.sent == false || (idx == messageGroup.length-1 && index == currentRoom.messagesGroup.length - 1)) ? 'visibility:visible' : 'visibility:hidden'">
                    <q-icon :name="message.sent == true ? 'mdi-send-circle-outline': 'mdi-circle-outline'"/>
                  </span>
                </div>
              </div>
            </div>
          
          </q-scroll-area>
          <!-- <q-page-sticky position="bottom-center" :offset="[0, 18]">
            <q-btn fab icon="add" color="accent" />
          </q-page-sticky> -->
        </q-page>
           
   
      </q-page-container>

      <q-footer>

        <q-toolbar style="align-items:end;" class="bg-grey-3 text-black row q-py-sm">

          <q-btn round flat icon="mdi-emoticon-outline">
            <q-menu>
              <div>
                <EmojiPicker :native="true" @select="onSelectEmoji" />
              </div>
            </q-menu>
          </q-btn>
          <q-file ref="qFileInput" style="display:none" v-model="inputFiles" multiple></q-file>
          <q-btn round flat icon="mdi-image-outline" class="q-mr-sm" @click="getFile"></q-btn>

          <div class="WAL__card bg-white col-grow q-mr-sm q-px-sm">
            <div class="bg-grey-4 q-mt-sm q-mx-sm q-px-md q-py-xs reply-box" v-if="replyMsg != null">
              <q-icon name="mdi-reply" />
              Replying to <span class="text-bold">{{ replyMsg.from == Id ? 'Yourself' : store.users.get(replyMsg.from).name}}</span>
              <div>
                {{replyMsg.type == 'text' ? replyMsg.content : replyMsg.type}}
              </div>
            </div>
            <q-scroll-area v-if="inputFiles.length > 0" style="height: 3.3em; max-width: 100%;" class="q-pb-none q-mx-sm" :thumb-style="thumbStyle" :bar-style="barStyle">

              <div class="row no-wrap">
                <q-chip removable @remove="inputFiles.splice(index, 1)" class="q-mt-sm q-mr-sm q-ml-none" v-for="(file, index) in inputFiles" :key="index">
                  {{ file.name }}
                </q-chip>
              </div>
            </q-scroll-area>

            <!-- <img src="https://img.vn/uploads/thuvien/singa-png-20220719150401Tdj1WAJFQr.png"/> -->
            <q-input rounded outlined borderless dense bg-color="white" class="WAL__field" v-model="inputMessageText" placeholder="Type a message" @keydown.enter="submitMessage" />
          </div>
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
  padding-top: 20px
  padding-bottom: 20px

  &:before
    content: ''
    height: 127px
    position: fixed
    top: 0
    width: 100%
    background-color: #009688

  &__layout
    margin: 0 auto
    z-index: 4000
    height: 100%
    width: 90%
    max-width: 1440px
    border-radius: 5px

  &__field
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

.conversation__summary
  margin-top: 4px

.conversation__more
  margin-top: 0!important
  font-size: 1.4rem


.round-border
  // .q-message-text
  //   padding:
  .q-message-text--sent
    border-radius: 12px
  .q-message-text--received
    border-radius: 12px 12px 12px 0px
    
.remove-triagle 
  .q-message-text--sent
    &:last-child
      &:before
        left: unset
  
  .q-message-text--received
    &:last-child
      &:before
        right: unset


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

.page-chat
  padding: 16px 16px 0px 16px
    // background: radial-gradient(circle at left bottom ,transparent 14%,#ded2a6 15%, #ded2a6 25%, transparent 26%, transparent 34%,#ded2a680 35%, #ded2a680 45%, transparent 46%, transparent 54%, #ded2a6 55%, #ded2a6 65%, transparent 66%, transparent 74%, #ded2a680 75%, #ded2a680 85%, transparent 86%)
    // background-size: 2em 2em
    // background-color: #ffffff
    // opacity: 1
   
    // background-image: linear-gradient(45deg, transparent 20%, grey 25%, transparent 25%), linear-gradient(-45deg, transparent 20%, grey 25%, transparent 25%), linear-gradient(-45deg, transparent 75%, grey 80%, transparent 0), radial-gradient(gray 2px, transparent 0)
    // background-size: 30px 30px, 30px 30px
</style>