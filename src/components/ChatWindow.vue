<template>
  <div>

    <q-infinite-scroll reverse @load="onLoad">
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
            :login-user-id="store.loginUser.id"
            :message="message"
            :user="store.users[message.from]"
            @reply="this.$emit('reply', message)"
          ></room-message>
        </div>
      </div>
    </q-infinite-scroll>
  </div>
</template>

<script setup name="Room">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  computed,
  watch,
} from "vue";
import {
  ROOM_TYPE,
  USER_TYPE,
  USER_TYPE2TEXT,
  MESSAGE_TYPE,
  MESSAGE_TYPE2TEXT,
} from "../assets/varible";
import RoomMessage from "./RoomMessage/RoomMessage.vue";
import dateFormat, { masks } from "dateformat";
import store from "../stores/store.js";

const props = defineProps({
  loginUserId: { type:String, required: true },
  messages: { type: Object, required: true },
  readIdx: { type: Number, required: true },
});
const emit = defineEmits(['reply'])

const loadValue = 7;
const loadIdxStart = ref(Math.max(0, props.readIdx - loadValue))
const msgsIdArr = computed(() => {
  return Object.keys(props.messages)
})
const msgsIdArrLoad = computed(() => {
  return msgsIdArr.value.slice(loadIdxStart.value)
})



function onLoad(index, done) {
  setTimeout(() => {
    loadIdxStart.value = Math.max(0, loadIdxStart.value - 7);
    done();
  }, 200);
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
