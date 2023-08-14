<template>
  <q-layout view="lhr lpr lfr">
    <q-page-container>
      <q-page
        class="window-height window-width row justify-center items-center"
        style="background-color: #009688"
      >
        <div class="column">
          <div class="row">
            <h5 class="text-h4 text-white q-my-md">Login</h5>
          </div>
          <div class="row">
            <q-card square bordered class="q-pa-lg shadow-1">
              <q-card-section>
                <q-form class="q-gutter-md">
                  <q-input
                    filled
                    clearable
                    v-model="email"
                    type="email"
                    label="Email"
                  />
                  <q-input
                    v-model="password"
                    filled
                    :type="isPwd ? 'password' : 'text'"
                    label="Password"
                  >
                    <template v-slot:append>
                      <q-icon
                        :name="isPwd ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer"
                        @click="isPwd = !isPwd"
                      />
                    </template>
                  </q-input>
                </q-form>
              </q-card-section>
              <q-card-actions class="q-px-md">
                <q-btn
                  unelevated
                  color="light-green-7"
                  size="lg"
                  class="full-width"
                  label="Login"
                  @click="Login"
                />
              </q-card-actions>
              <q-card-section class="text-center q-pa-none">
                <p class="text-grey-6">Not reigistered? Created an Account</p>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Cookies from "js-cookie";
const ip = "localhost";
console.log(ip);
const router = useRouter();
const isPwd = ref(true);
const email = ref("");
const password = ref("");

const Login = async () => {
  let data = new FormData();
  data.append("email", email.value);
  data.append("password", password.value);

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "http://localhost:3000/login",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      Cookies.set("access_token", response.data.accessToken);
      Cookies.set("refresh_token", response.data.refreshToken);
      router.push({
        path: "/chat",
      });
    })
    .catch((error) => {
      console.log(error.response.data.err);
    });
};
</script>

<style lang="scss">
.q-card {
  width: 360px;
}
</style>
