<template>
  <div class="vtc-room-add-wrapper">
    <q-btn fab icon="add" color="teal-5">
      <q-menu 
        class="vtc-room-add-menu" 
        @hide="resetNewRoom(); showNewGroupSelect = false;"
      >
        <div v-if="!showNewGroupSelect" class="bg-grey-3 q-px-sm q-py-md">
          <div>
            <div class="text-h6 q-mb-sm q-px-md">New Chat</div>
            <q-input color="teal-6" bg-color="white" placeholder="Search" class="q-mb-md q-pl-md q-pr-sm smaller-input"
              dense filled v-model="searchUserDisplayname" autofocus>
              <template v-slot:after>
                <q-btn class="q-mb-sm" size="md" dense flat icon="search" />
              </template>
            </q-input>
            <q-item clickable v-ripple class="new-chat-item q-mb-sm" @click="showNewGroupSelect = true">
              <q-item-section avatar>
                <q-avatar color="teal" text-color="white" icon="mdi-account-group-outline" />
              </q-item-section>
              <q-item-section>New Group</q-item-section>
            </q-item>
            <div class="text-subtitle2 text-weight-light q-mb-sm q-px-md">
              All friends
            </div>
          </div>
          <div>
            <q-scroll-area style="height: 300px">
              <template v-for="user in loginUser.friends">
                <q-item clickable v-ripple class="new-chat-item q-mb-sm" v-if="users[user.id].displayname.includes(
                  searchUserDisplayname
                )
                  " @click="startChat(user.id)" v-close-popup>
                  <q-item-section avatar>
                    <q-avatar>
                      <img :src="users[user.id].avatar" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>{{
                    `${users[user.id].displayname} ${user.id == loginUserId ? "(You)" : ""
                      }`
                  }}</q-item-section>
                </q-item>
              </template>
            </q-scroll-area>
          </div>
        </div>
        <div v-if="showNewGroupSelect">
          <div :class="{
            'bg-white q-pt-md q-pb-sm ': true,
            'bg-grey-2': groupSelectedUsersId.length > 0,
          }">
            <div class="q-mx-md" style="display: flex">
              <q-btn dense flat icon="mdi-arrow-left" size="md" padding="sm" @click="showNewGroupSelect = false" />
              <div style="display: flex; align-items: center" class="q-px-sm text-h6">
                New Group
              </div>
            </div>
            <div v-if="groupSelectedUsersId.length > 0">
              <div class="q-mx-md q-mb-sm q-mt-sm" style="display: flex">
                <q-btn round flat @click="openQFile()">
                  <q-avatar class="q-pa-none profilepic">
                    <img class="profilepic__image" :src="avatarNewRoom" />
                    <q-icon class="profilepic__content" size="20px" color="white" name="mdi-pencil-outline"></q-icon>
                  </q-avatar>
                </q-btn>
                <q-file ref="qFileAvatarNewRoom" style="display: none" v-model="inputFileAvatarNewRoom"
                  accept=".jpg, .png" @update:model-value="handleUploadAvatarNewRoom()"></q-file>
                <div style="display: flex; align-items: center" class="q-ml-md">
                  <q-input outlined color="teal-6" bg-color="white" placeholder="Group Name" class="smaller-input" dense
                    filled v-model="nameNewRoom">
                  </q-input>
                </div>
              </div>
              <div class="truncate-chip-labels q-mb-md q-mx-md">
                <template v-for="(userId, index) in groupSelectedUsersId">
                  <q-chip removable square color="teal" text-color="white" @remove="
                    groupSelectedUsersId.value =
                    groupSelectedUsersId.splice(index, 1)
                    " :label="users[userId].displayname">
                    <q-tooltip>{{
                      users[userId].displayname
                    }}</q-tooltip>
                  </q-chip>
                </template>
              </div>
              <div class="flex flex-end q-px-sm">
                <q-btn class="full-width bg-white shadow-1" dense no-caps unelevated @click="groupSelectedUsersId = []">
                  Cancel
                </q-btn>
                <span class="q-mx-xs"></span>
                <q-btn class="bg-teal-6 text-white full-width shadow-1" dense no-caps unelevated v-close-popup
                  @click="createGroup()">
                  Create
                </q-btn>
              </div>
            </div>
          </div>

          <div class="bg-white q-px-sm q-pb-md">
            <q-input outlined color="teal-6" bg-color="grey-3" placeholder="Search"
              class="q-mb-sm q-pl-md q-pr-md q-mt-md smaller-input" dense filled v-model="searchUserDisplayname"
              autofocus>
            </q-input>
            <div class="text-subtitle2 text-weight-light q-mb-sm q-px-md">
              All friends
            </div>

            <div>
              <q-scroll-area style="height: 300px">
                <template v-for="user in loginUser.friends">
                  <q-item clickable v-ripple class="new-chat-item q-mb-sm" v-if="users[user.id].displayname.includes(
                    searchUserDisplayname
                  ) && user.id != loginUser.id
                    ">
                    <q-item-section avatar>
                      <q-avatar>
                        <img :src="users[user.id].avatar" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>{{
                      `${users[user.id].displayname} ${user.id == loginUser.id ? "(You)" : ""
                        }`
                    }}</q-item-section>
                    <q-item-section avatar>
                      <q-checkbox v-model="groupSelectedUsersId" color="teal-6" :val="user.id" />
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
</template>

<script>
import dateFormat, { masks } from "dateformat";
export default {
  name: 'RoomContent',
  props: {
    loginUser: { type: Object, required: true },
    users: { type: Object, required: true }
  },
  emit: [
    'create-group'
  ],
  data() {
    return {
      showNewGroupSelect: false,
      searchUserDisplayname: "",
      groupSelectedUsersId: [],
      inputFileAvatarNewRoom: null,
      avatarNewRoom: "http://localhost:3000/assets?fileName=Blank-Avatar.png",
      nameNewRoom: ""
    }
  },
  methods: {
    async resetNewRoom() {
      this.groupSelectedUsersId = []
      this.inputFileAvatarNewRoom = null;
      this.avatarNewRoom = "http://localhost:3000/assets?fileName=Blank-Avatar.png"
      this.nameNewRoom = ""
    },
    handleUploadAvatarNewRoom() {
      if (this.inputFileAvatarNewRoom != null) {
        this.avatarNewRoom = this.getURLFromFile(this.inputFileAvatarNewRoom);
      }
    },
    openQFile() {
      this.$refs.qFileAvatarNewRoom.click()
    },
    async createGroup() {
      if (this.inputFileAvatarNewRoom == null) {
        this.inputFileAvatarNewRoom = await this.getFileFromUrl(`http://localhost:3000/assets?fileName=Blank-Avatar.png`, 'Blank-Avatar.png');
      }
      let usersId = [this.loginUser.id]
      for (let userId of this.groupSelectedUsersId) {
        usersId.push(userId)
      }
      this.$emit('create-group', usersId, this.inputFileAvatarNewRoom, this.nameNewRoom)
    }
  }
}
</script>

<style lang="scss">
@import "./RoomAdd.scss";
</style>
