<template>
  <q-layout view="lhr lpr lfr">
    <q-page-container>
      <q-page
        class="window-height window-width row justify-center items-center"
        style="background-color: #009688"
      >
        <div class="column">
          <div class="row">
            <h5 class="text-h4 text-white q-my-md">Register</h5>
          </div>
          <div class="row">
            <q-card square bordered class="q-pa-lg shadow-1">
              <q-card-section>
                <q-form class="q-gutter-md">
                  <q-input
                    filled
                    clearable
                    v-model="firstname"
                    type="text"
                    label="First Name"
                  />
                  <q-input
                    filled
                    clearable
                    v-model="lastname"
                    type="text"
                    label="Last Name"
                  />
                  <q-input
                    filled
                    clearable
                    v-model="username"
                    type="text"
                    label="Username"
                  />
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
                    type="password"
                    label="Password"
                  />
                  <q-input
                    v-model="confirmPassword"
                    filled
                    type="password"
                    label="Confirm Password"
                  />
                </q-form>
              </q-card-section>
              <q-card-actions class="q-px-md">
                <q-btn
                  unelevated
                  color="light-green-7"
                  size="lg"
                  class="full-width"
                  label="Register"
                  @click="Register"
                />
              </q-card-actions>
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
const ip = "localhost";
const router = useRouter();

const firstname = ref("");
const lastname = ref("");
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const Register = async () => {
  let data = new FormData();
  data.append("firstname", firstname.value);
  data.append("lastname", lastname.value);
  data.append("username", username.value);
  data.append("email", email.value);
  data.append("password", password.value);
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `http://${ip}:3000/register`,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      router.push("/login");
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
