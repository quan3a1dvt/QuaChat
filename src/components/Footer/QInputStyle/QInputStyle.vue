<template>
  <div>
    <!-- <ExtentedChips></ExtentedChips> -->
    <q-input
      rounded
      borderless
      dense
      bg-color="grey-1"
      style="width: 660px"
      v-model="inputText"
      @update:model-value="handleInput"
      ref="input"
      placeholder="Type a message"
      @keydown.enter="submitMessage"
    >
      <div
        class="q-field__native"
        v-html="this.inputTextFormat"
        style="pointer-events: none; z-index: 4; position: absolute; color: brown"
      ></div>
      <q-menu
        no-focus
        self="top start"
        anchor="bottom start"
        style="top: unset; bottom: 50px; max-height: fit-content; overflow: hidden"
      >
        <q-list>
          <template v-for="user in room.users">
            <q-item
              v-if="users[user.id].displayname.includes(tag)"
              clickable
              v-ripple
              class="q-manual-focusable"
            >
              <q-item-section avatar>
                <q-avatar>
                  <img :src="users[user.id].avatar" />
                </q-avatar>
              </q-item-section>

              <q-item-section>{{ users[user.id].displayname }}</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-menu>
    </q-input>
  </div>
</template>

<script>
import HighlightableInput from "./HighlightableInput.vue";
import ExtentedChips from "./ExtendedChips.vue";
import "floating-vue/dist/style.css";
export default {
  components: {
    HighlightableInput,
    ExtentedChips,
  },
  props: {
    room: { type: Object, required: true },
    users: { type: Object, required: true },
  },
  data() {
    return {
      inputText: "",
      highlight: ["v quan"],
      model: [],
      options: ["google", "nasa", "facebook"],
    };
  },
  computed: {
    tag() {
      const index = this.inputText.lastIndexOf("@");
      if (index > -1) {
        if (index > 0) {
          if (this.inputText.charAt(index - 1) != " ") return null;
        }
        const ttag = this.inputText.substring(index + 1);
        return ttag;
      } else return null;
    },
    inputTextFormat() {
      return `<span style="white-space: pre;">${this.inputText}</span>`;
    },
  },

  methods: {
    async submitMessage() {
      if (
        currentRoom.value.type == ROOM_TYPE.ONETOONE_ROOM &&
        !store.rooms.hasOwnProperty(currentRoomId.value)
      ) {
        store.rooms[currentRoomId.value] = currentRoom.value;
        const socket = SocketioService.getSocket();
        socket.emit("setupOneToOneRoom", currentRoom.value, async function (response) {
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
        });
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
    },
  },
};
</script>

<style lang="scss">
.mention {
  background-color: yellow;
  font-weight: bold;
}
</style>
