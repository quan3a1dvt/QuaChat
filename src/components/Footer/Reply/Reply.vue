<template>
  <div>
    <q-toolbar v-if="replyMsg != null">
      <q-btn style="visibility: hidden" flat icon="mdi-emoticon-outline"></q-btn>
      <q-btn style="visibility: hidden" flat icon="mdi-emoticon-outline"></q-btn>
      <div class="cursor-pointer full-width bg-grey-3 text-black q-mt-sm q-mr-sm reply-box" v-if="replyMsg != null"
        style="display: flex; justify-items: center">
        <div class="q-my-xs q-ml-md">
          <q-icon name="mdi-reply" />
          Replying to
          <span class="text-bold">{{
            replyMsg.from == loginUser.id
            ? "Yourself"
            : users[replyMsg.from].displayname
          }}</span>
          <div>
            {{
              replyMsg.type == this.MESSAGE_TYPE.TEXT
              ? replyMsg.content
              : this.MESSAGE_TYPE2TEXT[replyMsg.type]
            }}
          </div>
        </div>
        <q-space />
        <q-btn flat style="border-radius: 8px" icon="mdi-window-close" @click="removeReply()"></q-btn>
      </div>
    </q-toolbar>
  </div>
</template>

<script>
export default {
  props: {
    loginUser: { type: Object, required: true },
    users: { type: Object, required: true },
    replyMsg: { type: Object, required: false, default: null }
  },
  emit: ['submit-message', 'remove-reply'],
  data() {
    return {
    };
  },
  computed: {

  },
  methods: {
    removeReply() {
      this.$emit('remove-reply')
    }
  },
};
</script>

<style lang="scss">
.mention {
  background-color: yellow;
  font-weight: bold;
}
</style>
