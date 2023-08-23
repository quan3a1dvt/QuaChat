<template>
  {{ ((sent = message.from == loginUser.id), null) }}
  <div class="vtc-message-wrapper">
    <!-- <div class="vtc-card-info vtc-card-date">
			{{ message.createon }}
		</div> -->
    <!-- {{ message.type }}
    <div v-if="message.type== this.MESSAGE_TYPE.EVENT">{{message}}</div> -->
    <div class="flex vtc-message-container" :class="{ 'justify-end': sent, 'justify-start': !sent }">

      <div v-if="!sent" class="flex items-start q-pr-sm">
        <q-avatar>
          <img :class="{ invisible: !message.isStartMsg }" :src="user.avatar" />
        </q-avatar>
      </div>
      <div>
        <div class="flex" :class="{ 'justify-end': sent }">
          <div class="vtc-message-card bg-white" :sent="sent" :class="{ 'bg-green-2': sent }">
            <q-menu touch-position context-menu square class="vtc-message-menu">
              <div class="vtc-emoji-wrapper">
                <q-btn size="xl" dense flat round padding="0px" unelevated rounded v-close-popup
                  class="vtc-emoji-template" @click="sendEmote('❤️')">❤️</q-btn>
                <q-btn size="xl" dense flat round padding="0px" unelevated rounded v-close-popup
                  class="vtc-emoji-template" @click="sendEmote('😆')">😆</q-btn>
                <q-btn size="xl" dense flat round padding="0px" unelevated rounded v-close-popup
                  class="vtc-emoji-template" @click="sendEmote('😮')">😮</q-btn>
                <q-btn size="xl" dense flat round padding="0px" unelevated rounded v-close-popup
                  class="vtc-emoji-template" @click="sendEmote('😠')">😠</q-btn>
                <q-btn size="xl" dense flat round padding="0px" unelevated rounded v-close-popup
                  class="vtc-emoji-template" @click="sendEmote('👍')">👍</q-btn>
                <!-- <q-btn round icon="add" class="bg-grey-3" size="md"></q-btn> -->
              </div>
              <q-list class="vtc-menu-list">
                <q-item clickable v-close-popup @click="this.$emit('reply', message)" dense style="padding: 9px 16px">
                  <q-item-section>Reply</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="copyText(message)" dense style="padding: 9px 16px">
                  <q-item-section>Copy</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="copyText(message)" dense style="padding: 9px 16px">
                  <q-item-section>Emote</q-item-section>
                </q-item>
                <q-separator />
              </q-list>
            </q-menu>

            <div class="bg-grey-4 q-mb-sm q-px-sm q-py-xs reply-box" v-if="message.replyMsg != null">
              <span class="text-bold text-green-6">{{
                message.replyMsg.from == loginUser.id ? "You" : user.displayname
              }}</span>
              <div v-if="message.replyMsg.type == this.MESSAGE_TYPE.TEXT">
                {{ message.replyMsg.content }}
              </div>
              <div v-if="message.replyMsg.type != this.MESSAGE_TYPE.TEXT">
                <span class="text-capitalize">{{
                  this.MESSAGE_TYPE2TEXT[message.replyMsg.type]
                }}</span>
              </div>
            </div>

            <div v-if="message.type == this.MESSAGE_TYPE.TEXT">
              {{ message.content }}
            </div>

            <div v-if="message.type == this.MESSAGE_TYPE.IMAGE">
              <img @click="
                selectedMsg = message;
              mediaDialog = true;" style="border-radius: 10px; max-height: 25vh; max-width: 35vh"
                :src="message.file.src" />
            </div>
            <div v-if="message.type == this.MESSAGE_TYPE.VIDEO">
              <video preload="metadata" style="border-radius: 10px" controls width="320" :src="message.file.src"
                type="video/mp4"></video>
            </div>
            <div v-if="message.type == this.MESSAGE_TYPE.DOCUMENT">
              <q-item @click="download(message.file.id, message.file.name)" clickable v-ripple
                class="q-px-sm bg-blue-grey-1 q-mb-xs" style="border-radius: 0.7rem">
                <q-item-section avatar top>
                  <q-avatar icon="mdi-file" color="teal" text-color="white" />
                </q-item-section>

                <q-item-section>
                  <q-item-label lines="1">{{ message.file.name }}</q-item-label>
                  <q-item-label caption>
                    {{ message.file.name.split(".").pop().toUpperCase() }}
                    {{ convertFileSize(message.file.size) }}</q-item-label>
                </q-item-section>
              </q-item>
            </div>


            <q-dialog v-model="mediaDialog" v-if="selectedMsg != null">
              <div v-if="selectedMsg.type == this.MESSAGE_TYPE.VIDEO">
                <video preload="metadata" controls :src="selectedMsg.file.src" type="video/mp4"></video>
              </div>
              <q-img v-if="selectedMsg.type == this.MESSAGE_TYPE.IMAGE" :src="selectedMsg.file.src"></q-img>
            </q-dialog>
            <div class="fit-content" :class="{
              'q-ml-lg': true,
            }">
              <div style="display: flex; justify-content: end">
                <div style="display: block">
                  <span style="opacity: 0.6; font-size: x-small">{{
                    getTimeFromStamp(message.createon)
                  }}</span>
                  <q-icon v-if="message.sent == true && sent" color="primary" class="q-ml-xs" name="mdi-check-all" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="vtc-emote q-mt-xs" :class="{ 'justify-end': sent, 'justify-start': !sent }">
          <template v-for="emote in emotes">
            <q-btn flat dense unelevated padding="0px" @click="
                                                                            {
              if (emoteSender = message.emotes[[loginUser.id, emote.emote]] != undefined) {
                this.$emit(
                  'remove-emote',
                  [loginUser.id, emote.emote],
                  message.id
                )
              } else {
                this.$emit('send-emote', emote.emote, message.id);
              }
            }
              ">
              <div class="bg-teal-1 q-pr-xs q-pl-xs" style="border-radius: 3px" :class="{
                'bg-teal-3': emoteSender = message.emotes[[loginUser.id, emote.emote]] != undefined,
                'q-mr-xs': !sent,
                'q-ml-xs': sent,
              }">
                <span class="q-pr-xs">{{ emote.emote }}</span>
                <span>{{ emote.val }}</span>
              </div>
            </q-btn>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dateFormat, { masks } from "dateformat";
import Cookies from "js-cookie";
import axios from "axios";
export default {
  props: {
    loginUser: { type: Object, required: true },
    user: { type: Object, required: true },
    message: { type: Object, required: true },
  },
  emit: [
    'reply',
    'send-emote',
    'remove-emote'
  ],
  data() {
    return {
      mediaDialog: false,
      selectedMsg: null,
    }
  },
  computed: {
    emotes() {
      let es = {};
      for (let key in this.message.emotes) {
        const emote = this.message.emotes[key];
        if (es[emote[1]] != undefined) {
          es[emote[1]].val = es[emote[1]].val + 1;
        } else {
          es[emote[1]] = { emote: emote[1], val: 1 };
        }
      }
      return es;
    }
  },
  methods: {
    getTimeFromStamp(stamp) {
      let target = new Date(stamp);
      return dateFormat(target, "h:MM TT");
    },
    convertFileSize(size) {
      if (size < 1024) {
        return `${size} B`;
      } else {
        if (size < 1024 * 1024) {
          return `${Math.round(size / 1024)} KB`;
        } else return `${Math.round(size / (1024 * 1024))} MB`;
      }
    },
    sendEmote(emote) {
      this.$emit('send-emote', emote, this.message.id)
    },
    async download(fileId, fileName) {
      var config = {
        method: "get",
        responseType: "blob",
        maxBodyLength: Infinity,
        headers: {
          access_token: await Cookies.get("access_token"),
        },
        url: `http://localhost:3000/file?id=${fileId}&fileName=${fileName}`,
      };

      axios(config)
        .then(function (response) {
          const url = window.URL.createObjectURL(response.data);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `${fileName}`);
          document.body.appendChild(link);
          link.click();
        })
        .catch(function (error) {
          console.log(error);
        });
    }

  },
  mounted() {
  }
}
</script>


<style lang="scss">
@import "./RoomMessage.scss";
</style>
