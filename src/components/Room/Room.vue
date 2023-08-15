<template>
  {{ (msgsIdArr = Object.keys(room.messages), null) }}
  {{ (readIdx = room.users[loginUserId].readIdx, null) }}
  {{ (unreadMsg = msgsIdArr.length - (readIdx + 1), null) }}
  {{ (lastMessage = room.messages[msgsIdArr[msgsIdArr.length - 1]], null) }}
  <q-item
    clickable
    v-ripple
    class="dialog" :class="{ 'active': active }"
    @click="$emit('click')"
  >
    <q-item-section avatar>
      <q-avatar size="54px">
        <img :src="room.avatar" />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label class="dialog-top">
        <div class="dialog-title" :class="{ 'active-text': active }">
          {{ room.name }}
        </div>
        <q-space />
        <div class="dialog-date" :class="{ 'active-text': active }"
        >
          {{ getShortTimeFormat(lastMessage.createon) }}
        </div>
      </q-item-label>
      <q-item-label  class="dialog-bottom">
        <div class="dialog-last_message" :class="{ 'active-text': active }">
          {{
            lastMessage.type == MESSAGE_TYPE.TEXT
              ? `${
                  lastMessage.from == loginUserId
                    ? "You"
                    : users[lastMessage.from].displayname
                }: ${lastMessage.content}`
              : lastMessage.type == MESSAGE_TYPE.EVENT
              ? lastMessage.content
              : `${
                  lastMessage.from == loginUserId
                    ? "You"
                    : users[lastMessage.from].displayname
                } sent a ${MESSAGE_TYPE2TEXT[lastMessage.type]}`
          }}
        </div>
        <q-space></q-space>
        <div v-if="unreadMsg > 0">
          <q-badge
            color="teal-6"
            rounded
            :label="unreadMsg"
            text-color="white"
          />
        </div>
      </q-item-label>
    </q-item-section>
  </q-item>
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
import dateFormat, { masks } from "dateformat";


const props = defineProps({
  room: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    required: true
  },
  loginUserId: { type: String, required: true },
  users: {
    type: Object,
    required: true
  }
})
// const emit = defineEmits(['click'])



function getShortTimeFormat(stamp) {
  let target = new Date(stamp);
  let now = new Date();
  let nowDayIdx = parseInt(dateFormat(now, "d"));
  let targetDayIdx = parseInt(dateFormat(target, "d"));
  if (nowDayIdx - targetDayIdx == 0) {
    return dateFormat(target, "HH:MM");
  } else if (0 < nowDayIdx - targetDayIdx && nowDayIdx - targetDayIdx < 7) {
    return dateFormat(target, "ddd");
  } else {
    return dateFormat(target, "mmm d");
  }
}


</script>

<style lang="scss">
.dialog {
  border-radius: 6px;
  &.active {
    background-color: #3390ec;
    color: #fff
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
  color:#fff
}
</style>
