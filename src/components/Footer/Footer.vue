<template>
  <div>
    <reply 
      :login-user="loginUser"
      :users="users"
      :reply-msg="replyMsg"
    />
    <q-toolbar class="text-black row q-py-sm" v-if="currentRoomId != null">
      <q-btn flat icon="mdi-emoticon-outline">
        <q-menu>
          <div>
            <EmojiPicker @select="onSelectEmoji" />
          </div>
        </q-menu>
      </q-btn>
      <q-file ref="qFileInput" style="display: none" v-model="inputFiles" append multiple></q-file>

      <q-input-style  :room="currentRoom" :users="store.users">
      </q-input-style>
      <q-btn round flat icon="mic" />
    </q-toolbar>
  </div>
</template>

<script>
import Reply from './Reply/Reply.vue'
import QInputStyle from './QInputStyle/QInputStyle.vue';
export default {
  components: {
    Reply
  },
  props: {
    room: { type: Object, required: true },
    users: { type: Object, required: true },
    replyMsg: {type: Object, required: false, default: null}
  },
  emit: ['submit-message'],
  data() {
    return {
    };
  },
  computed: {
    
  },

  methods: {

  },
};
</script>

<style lang="scss">
.mention {
  background-color: yellow;
  font-weight: bold;
}
</style>
