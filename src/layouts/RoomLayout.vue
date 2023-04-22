<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch
} from 'vue'
import {
  useRoute
} from 'vue-router';
import axios from 'axios'
import SocketioService from '../services/socketio.service.js';
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import dateFormat, { masks } from "dateformat";

const route = useRoute()
const store = SocketioService.getStore()
const Id = route.params.id
SocketioService.setupSocketConnection(Id);


const currentRoomId = ref(null)

const currentRoom = computed(() => {
    return store.rooms.get(currentRoomId.value)
})

function setCurrentRoomId(id) {
    currentRoomId.value = id
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
        console.log(store.rooms)
        test()
    }, 1000);
})
// test()

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


const getShortTimeFormat = ((time) => {
    let target = new Date(time)
    let now = new Date()
    let nowDayIdx = parseInt(dateFormat(now, "d"))
    let targetDayIdx = parseInt(dateFormat(target, "d"))
    if (nowDayIdx - targetDayIdx == 0) { return dateFormat(target, "HH:MM") }
    else if (0 < nowDayIdx - targetDayIdx && nowDayIdx - targetDayIdx < 7) {return dateFormat(target, "ddd")}
    else { return dateFormat(target, 'mmm d')}
})

const inputMessageText = ref('')
const replyMsg = ref(null)
const onSelectEmoji = ((emoji) => {
    inputMessageText.value = inputMessageText.value + emoji.i
})
const submitMessage = (async () => {
//   showUpload.value = false
//   if (inputMessageText.value == "") {
//     if (files.value == null) {
//       return
//     }
//   }
//   if (files.value != null) {
//     for (let file of files.value) {
//       let createon = Date.now()
//       let file_id = createon
//       SocketioService.upload(file, selectedRoomId.value, file_id, {
//         id: file_id,
//         from: id,
//         to: selectedRoomId.value,
//         createon: createon,
//         isPreview: true,
//         type: file.type.startsWith('image') ? 'image' : (file.type.startsWith('video') ? 'video' : 'file'),
//         file: {
//           name: file.name,
//           src: URL.createObjectURL(file),
//           id: file_id,
//           type: file.type,
//           size: file.size,
//           progress: 0,
//         },
//         reply: replyMsg.value != null ? replyMsg.value : null
//       })
//     }
//   }
  let createon = Date.now()
  let id = createon
  if (inputMessageText.value != "") {
    SocketioService.sendMessage({
      id: id,
      from: Id,
      to: currentRoomId.value,
      createon: createon,
      status: 'pending',
      type: 'text',
      content: inputMessageText.value,
      reply: replyMsg.value != null ? replyMsg.value : null
    })
  }

  inputMessageText.value = ''
  replyMsg.value = null
//   files.value = null
  // observeHeight()
})


const leftDrawerOpen = ref(true)
const search = ref('')
const message = ref('')


const style = computed(() => ({
    height: 100 + 'vh'
}))

function toggleLeftDrawer() {
    leftDrawerOpen.value = !leftDrawerOpen.value
}


</script>

<template v-if="store.roomsArr.length > 0" >
<div style="">
<div class="WAL position-relative bg-grey-4" style="height: 100vh;">
    <q-layout view="lHh Lpr lFf" class="WAL__layout shadow-3" container >
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
                <q-btn round flat icon="more_vert">
                    <q-menu auto-close :offset="[110, 0]">
                        <q-list style="min-width: 150px">
                            <q-item clickable>
                                <q-item-section>Contact data</q-item-section>
                            </q-item>
                            <q-item clickable>
                                <q-item-section>Block</q-item-section>
                            </q-item>
                            <q-item clickable>
                                <q-item-section>Select messages</q-item-section>
                            </q-item>
                            <q-item clickable>
                                <q-item-section>Silence</q-item-section>
                            </q-item>
                            <q-item clickable>
                                <q-item-section>Clear messages</q-item-section>
                            </q-item>
                            <q-item clickable>
                                <q-item-section>Erase messages</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </q-toolbar>
        </q-header>

        <q-drawer v-model="leftDrawerOpen" show-if-above bordered :breakpoint="690">
            <q-toolbar class="bg-grey-3">
                <q-avatar class="cursor-pointer">
                    <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
                </q-avatar>
                <q-toolbar-title>Chats</q-toolbar-title>
                <q-space />
                    
                <q-btn round flat icon="mdi-account-plus-outline" @click="isAddFriendDialog=true"/>
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
                    <q-item v-for="room in store.roomsArr" :key="room.id" clickable v-ripple @click="setCurrentRoomId(room.id)" >
                        {{(msgNum=room.messages.length,null) }}
                        {{(lastMsg=room.messages[msgNum - 1], unreadNum = msgCount - (room.usersProperty[Id].readIdx + 1), null)}}
                        <q-item-section avatar>
                            <q-avatar >
                                <img v-if="room.type==0 || room.type == 2" :src="room.avatar" >
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
                            <q-item-label lines="1" class="parent" >
                                <div class="dynamic-width-child">
                                    {{ room.name }}
                                </div>
                                <q-space/>
                                <div :class="{'text-weight-bold text-teal-6' : unreadNum > 0,'fixed-width-child':true}">{{ getShortTimeFormat(lastMsg.createon) }}</div>
                            </q-item-label>
                            <q-item-label class="conversation__summary parent" caption>
                                <div class="dynamic-width-child">
                                    {{ lastMsg.type=='text' ? `${store.users.get(lastMsg.from).id == Id ? 'You' : store.users.get(lastMsg.from).name}: ${lastMsg.content}`: (lastMsg.type =='evt' ?  lastMsg.content : `${store.users.get(lastMsg.from).id == Id ? 'You' : store.users.get(lastMsg.from).name} sent a ${lastMsg.type}`)}}
                                </div>
                                <q-space/>
                                <div class="fixed-width-child">
                                    <q-badge v-if="unreadNum > 0" color="teal-6" rounded text-color="white" :label="unreadNum" />
                                </div>
                            </q-item-label>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-scroll-area>
        </q-drawer>

        <q-page-container class="bg-grey-2">
            <q-page>
                <div class="q-pa-md row justify-center" v-if="currentRoom != null">
                    <div style="width: 100%;">
                    <div v-for="(messageGroup, index) in currentRoom.messagesGroup" :key="index">
                    <q-chat-message
                        v-if="messageGroup[0].from == Id"
                        stamp="7 minutes ago"
                        sent
                        bg-color="green-2"
                    >
                        <div v-for="(message, idx) in messageGroup" :key="idx">
                            <div v-if="message.type == 'text'">{{ message.content }}</div>
                        </div>
                    </q-chat-message>
                    <q-chat-message
                        v-if="messageGroup[0].from != Id"
                        name="Jane"
                        avatar="https://cdn.quasar.dev/img/avatar5.jpg"
                        stamp="4 minutes ago"
                        text-color="white"
                        bg-color="primary"
                    >
                        <div v-for="(message, idx) in messageGroup" :key="idx">
                            <div v-if="message.type == 'text'">{{ message.content }}</div>
                        </div>
                    </q-chat-message>
                    </div>
                    </div>
                </div>
            </q-page>
        </q-page-container>

        <q-footer>
            <!-- <q-toolbar class="bg-grey-3" >
            <q-card class="my-card bg-grey-3 text-black" style="width: 100%" flat>
                <q-tabs v-model="tab" class="text-teal">
                    <q-tab label="Tab one" name="one" />
                    <q-tab label="Tab two" name="two" />
                </q-tabs>

                <q-separator />

                <q-tab-panels v-model="tab" animated class="bg-grey-3 ">
                    <q-tab-panel name="one">
                    The QCard component is a great way to display important pieces of grouped content.
                    </q-tab-panel>

                    <q-tab-panel name="two">
                    With so much content to display at once, and often so little screen real-estate,
                    Cards have fast become the design pattern of choice for many companies, including
                    the likes of Google and Twitter.
                    </q-tab-panel>
                </q-tab-panels>
            </q-card>
            </q-toolbar> -->
            
            <q-toolbar class="bg-grey-3 text-black row q-py-sm">
              
                <q-btn round flat icon="mdi-emoticon-outline" >
                    <q-menu>
                        <div>
                            <EmojiPicker :native="true" @select="onSelectEmoji" />
                        </div> 
                    </q-menu>
                </q-btn>
                <q-btn round flat icon="mdi-image-outline" class="q-mr-sm">
                    
                </q-btn>
                <q-field outlined rounded class="WAL__field col-grow q-mr-sm q-px-sm">
                    <template v-slot:control>
                        <q-input rounded borderless dense bg-color="white" v-model="inputMessageText" placeholder="Type a message" @keydown.enter="submitMessage"/>
                    </template>
                </q-field>
                <q-btn round flat icon="mic" />
            </q-toolbar>
        </q-footer>
    </q-layout>
</div>
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
    max-width: 950px
    border-radius: 5px

  &__field.q-field--outlined .q-field__control:before
    border: none

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

.parent 
  display: grid
  grid-template-columns: auto 10fr 1fr

.dynamic-width-child
  white-space: nowrap
  text-overflow: ellipsis
  overflow: hidden

.fixed-width-child 
  white-space: nowrap
</style>