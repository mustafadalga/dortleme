

<template>
  <div id="game-modal">
    <div
      id="modal1"
      class="modal"
      :class="animatedCSS ? 'animated bounceInDown': 'animated bounceOutUp'"
      tabindex="0"
    >
      <div class="modal-content">
        <h4 class="center" v-if="oyunDurumNo===5">
          <font-awesome-icon :icon="['fas', 'trophy']" class="font-awesome-size teal-text" />
        </h4>

        <div class="row" v-if="oyunDurumNo!==7">
          <div class="col s12 m6 offset-m3">
            <div class="card teal darken-1">
              <div class="card-content white-text center">
                <span class="card-title">Oyun Bitti {{ oyunDurumNo }}</span>
                <p>{{ description }}</p>
                <p v-if="oyunDurumNo===6">Oyun berabere kaldı.</p>
                <p v-else>Kazanan Oyuncu: {{kazananOyuncu == currentUser.email ? currentUser.username : rakip.username }}</p>
              </div>
              <hr />
              <div class="card-content white-text center modal-skor-durum">
                <span class="card-title">Skor Durumu</span>
                <div class="row">
                  <div class="col s12 m6">
                    <p>
                      <font-awesome-icon :icon="['fas', 'user']" class="font-awesome-size" />
                    </p>
                    <p>{{ kazananOyuncu ? (kazananOyuncu == currentUser.email ? currentUser.username : rakip.username) : currentUser.username }}</p>
                    <p>{{kazananOyuncu ? (kazananOyuncu == currentUser.email ? currentUserSkor : rakipSkor) :currentUserSkor }}</p>
                  </div>
                  <div class="col s12 m6">
                    <p>
                      <font-awesome-icon :icon="['fas', 'user']" class="font-awesome-size" />
                    </p>
                    <p>{{ kazananOyuncu ? (kazananOyuncu == currentUser.email ? rakip.username : currentUser.username) : rakip.username }}</p>
                    <p>{{ kazananOyuncu ? (kazananOyuncu == currentUser.email ? rakipSkor : currentUserSkor) : rakipSkor }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row" v-else>
          <div class="col s12 m6 offset-m3">
            <div class="card teal darken-1">
              <div class="card-content white-text center">
                <span class="card-title">Oyun Bitti</span>
                <p>{{ rakip.username+" oyundan çıkış yaptı." }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button
          v-if="oyunDurumNo===5 || oyunDurumNo===6"
          class="btn purple darken-3 waves-green"
          @click="yeniOyun"
        >Yeni Oyun</button>
        <button class="btn red btn-red" @click="oyundanCik">Oyundan Çık</button>
      </div>
    </div>
    <div
      class="modal-overlay"
      :class="animatedCSS ? 'animated bounceInDown': 'animated bounceOutUp'"
    ></div>
  </div>
</template>

<script>
import { faTrophy, faUser } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faTrophy, faUser);

export default {
  name: "GameOverModal",
  props: ["kazananOyuncu", "currentUserSkor", "rakipSkor", "oyunDurumNo"],
  data() {
    return {
      animatedCSS: true,
      rakip: null,
      kaybedenOyuncuIndex: null,
      kazananOyuncuIndex: null,
      description: null
    };
  },
  created() {
    this.currentUser = this.$session.get("user");
    this.rakip = this.$session.get("rakipOyuncu");
    if (this.oyunDurumNo === 3) {
      this.description =
        "Rakip oyuncu " +
        this.rakip.username +
        " oyundan çıkış yaptığın için hükmen mağlup oldu.";
    } else if (this.oyunDurumNo === 4) {
      this.description =
        "1 dakikalık bekleme süresi sonucunda rakip oyuncu " +
        this.rakip.username +
        " oyuna giriş yapmadığından dolayı hükmen mağlup oldu";
    }
     
  },
  methods: {
    yeniOyun() {
      this.animatedCSS = false;
      setTimeout(() => {
        this.$emit("yeniOyun");
      }, 500);
    },
    oyundanCik() {
      this.animatedCSS = false;
      setTimeout(() => {
        this.$emit("oyunCikis");
      }, 500);
    }
  }
};
</script>

<style>
.modal {
  z-index: 1003;
  display: block;
  opacity: 1;
  top: 10%;
  transform: scaleX(1) scaleY(1);
}
.modal-overlay {
  z-index: 1002;
  display: block;
  opacity: 0.5;
}
.btn-red {
  margin-left: 0.3em !important;
}
.modal-skor-durum .row {
  margin-bottom: 0px;
}
.modal-skor-durum .col {
  border-bottom: 1px solid #fff;
  margin-bottom: 1em;
  padding-bottom: 1em;
}
.modal-footer {
  text-align: center !important;
}
</style>