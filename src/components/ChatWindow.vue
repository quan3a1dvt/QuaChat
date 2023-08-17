<template>
  <div>

    <q-infinite-scroll reverse @load="onLoad" ref=“infiniteScroll”>
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner color="primary" name="dots" size="40px" />
        </div>
      </template>
  
      <div v-for="messageId of msgsIdArrLoad" :key="messageId" :id="messageId">
        {{ ((message = messages[messageId]), null) }}
        
        <div
          :style="
            message.from == loginUserId
              ? 'display:flex;justify-content: end'
              : ''
          "
          v-if="message.type != MESSAGE_TYPE.EVENT"
        >
          <room-message 
            :login-user-id="this.loginUserId"
            :message="message"
            :user="users[message.from]"
            :id=message.id
            @reply="(message) => this.$emit('reply', message)"
            @send-emote="(emote, messageId) => {this.$emit('send-emote', emote, messageId)}"
            @remove-emote="(emote, messageId) => {this.$emit('remove-emote', emote, messageId)}"
          ></room-message>
        </div>
      </div>
    </q-infinite-scroll>
  </div>
</template>
<script>
import RoomMessage from "./RoomMessage/RoomMessage.vue";
import dateFormat, { masks } from "dateformat";
export default {
  name: 'ChatWindow',
  components: {
		RoomMessage
	},

  props: {
    loginUserId: { type:String, required: true },
    messages: { type: Object, required: true },
    readIdx: { type: Number, required: true },
    users: { type: Object, required: true }
  },
  emit: [
    'reply',
    'send-emote',
    'remove-emote'
  ],
  data() {
    return {
      loadValue: 7,
      loadIdxStart: Math.max(0, this.readIdx - this.loadValue),
    }
  },
  computed: {
    msgsIdArr() {
      return Object.keys(this.messages)
    },
    msgsIdArrLoad() {
      return this.msgsIdArr.slice(this.loadIdxStart)
    }
  },
  method: {
    onLoad(index, done) {
      setTimeout(() => {
        this.loadIdxStart = Math.max(0, this.loadIdxStart - this.loadValue);
        if (this.loadIdxStart == 0) {
          console.log("das")
          this.$refs.infiniteScroll.stop()
        }
        done();
      }, 1000);
    }
  }
}
</script>


<style lang="scss" scoped>
.dialog {
  border-radius: 6px;
  &.active {
    background-color: #3390ec;
    color: #fff;
  }
  &-top {
    display: flex;
  }
  &-bottom {
    display: flex;
  }
  &-date {
    color: #b3b3b3;
    font-size: 12px;
    margin-bottom: 2px;
  }
  &-unread-count {
    background: #bfbfbf;
    font-size: 11px;
    padding: 5px;
    border-radius: 11px;
    min-width: 21px;
    font-weight: 900;
    color: #fff;
    margin-top: 4px;
  }
  &-title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: #222;
    font-weight: 700;

    font-size: 16px;
    margin-top: 2px;
    margin-bottom: 2px;
    max-width: 200px;
  }
  &-last_message {
    color: #999;
    font-size: 16px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-top: 2px;
    max-width: 280px;
    width: 100%;
  }
}
.active-text {
  color: #fff;
}
</style>
