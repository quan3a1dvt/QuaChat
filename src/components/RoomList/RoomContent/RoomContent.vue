<template>
  {{ (msgsIdArr = Object.keys(room.messages), null) }}
  {{ (readIdx = room.users[loginUser.id].readIdx, null) }}
  {{ (unreadMsg = msgsIdArr.length - (readIdx + 1), null) }}
  {{ (lastMessage = room.messages[msgsIdArr[msgsIdArr.length - 1]], null) }}
  <q-item clickable v-ripple class="dialog" :class="{ 'active': active }" @click="$emit('click')">
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
        <div class="dialog-date" :class="{ 'active-text': active }">
          {{ getShortTimeFormat(lastMessage.createon) }}
        </div>
      </q-item-label>
      <q-item-label class="dialog-bottom">
        <div class="dialog-last_message" :class="{ 'active-text': active }">
          {{
            lastMessage.type == MESSAGE_TYPE.TEXT
            ? `${lastMessage.from == loginUser.id
              ? "You"
              : users[lastMessage.from].displayname
            }: ${lastMessage.content}`
            : lastMessage.type == MESSAGE_TYPE.EVENT
              ? lastMessage.content
              : `${lastMessage.from == loginUser.id
                ? "You"
                : users[lastMessage.from].displayname
                } sent a ${MESSAGE_TYPE2TEXT[lastMessage.type]}`
          }}
        </div>
        <q-space></q-space>
        <div v-if="unreadMsg > 0">
          <q-badge color="teal-6" rounded :label="unreadMsg" text-color="white" />
        </div>
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import dateFormat, { masks } from "dateformat";
export default {
  name: 'RoomContent',
  props: {
    room: { type: Object, required: true },
    active: { type: Boolean, required: true },
    loginUser: { type: Object, required: true },
    users: { type: Object, required: true }
  },
  methods: {
    getShortTimeFormat(stamp) {
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
  }
}
</script>

<style lang="scss">
@import "./RoomContent.scss";
</style>
