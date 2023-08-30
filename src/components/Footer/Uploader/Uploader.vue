<template>
  <q-btn flat icon="mdi-paperclip" class="q-mr-sm">
    <q-menu @before-show="
      inputFiles = [];
    selectedInputFile = null;
    ">
      <div style="
          min-height: 360px;
          display: flex;
          justify-content: center;
          align-items: center;
        ">
        <img style="max-height: 350px" v-if="selectedInputFile != null &&
          selectedInputFile.type.startsWith('image')
          " :src="getURLFromFile(selectedInputFile)" />
        <video style="max-width: 500px" v-if="selectedInputFile != null &&
          selectedInputFile.type.startsWith('video')
          " :src="getURLFromFile(selectedInputFile)" controls></video>
        <div v-if="selectedInputFile != null &&
          !selectedInputFile.type.startsWith('video') &&
          !selectedInputFile.type.startsWith('image')
          ">
          <div class="flex flex-center q-mb-sm">
            <q-icon size="xl" name="mdi-file-outline"></q-icon>
          </div>

          <div class="flex flex-center q-mb-xs">
            {{ selectedInputFile.name }}
          </div>
          <div class="flex flex-center">
            <span>{{
              `${convertFileSize(selectedInputFile.size)}, ${selectedInputFile.type
                }`
            }}</span>
          </div>
        </div>
      </div>
      <div style="display: flex" class="bg-grey-3">
        <div style="padding-top: 12px; padding-bottom: 3px">
          <q-scroll-area style="width: 400px" class="flex full-height" :thumb-style="{ height: '6px' }">
            <div style="display: flex">
              <template v-for="(file, index) of inputFiles">
                <q-btn dense class="q-mx-xs q-pa-none" :style="`border-radius: 0.6;${selectedInputFile == null
                  ? 'opacity: 0.5'
                  : file.__key != selectedInputFile.__key
                    ? 'opacity: 0.5;'
                    : ''
                  }`" unelevated @click="selectedInputFile = file">
                  <img v-if="file.type.startsWith('image')" style="
                      height: 44px;
                      width: 44px;
                      border-radius: 6px;
                    " :src="getURLFromFile(file)" />
                  <video style="
                      height: 44px;
                      width: 44px;
                      border-radius: 6px;
                    " v-if="file.type.startsWith('video')" :src="getURLFromFile(file)"></video>
                  <q-icon style="
                      height: 44px;
                      width: 44px;
                      border-radius: 6px;
                    " v-if="!file.type.startsWith('video') &&
                      !file.type.startsWith('image')
                      " name="mdi-file-outline"></q-icon>
                </q-btn>
              </template>
            </div>
          </q-scroll-area>
        </div>
        <div style="padding: 12px">
          <q-btn style="height: 44px; width: 44px" icon="mdi-plus" @click="getFile">
          </q-btn>
          <q-btn class="q-ml-sm" style="height: 44px; width: 44px" color="teal-6" v-close-popup
            @click="submitMessage()">
            <q-icon size="16px" name="mdi-send-outline"> </q-icon>
          </q-btn>
        </div>
      </div>
    </q-menu>
  </q-btn>;
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
