

<template>
  <div id="game-modal">
    <div
      id="modal1"
      class="modal"
      :class="animatedCSS ? 'animated bounceInDown': 'animated bounceOutUp'"
      tabindex="0"
    >
      <div class="modal-content">
        <h4 class="center" v-if="gameStatusNo===5">
          <font-awesome-icon :icon="['fas', 'trophy']" class="font-awesome-size teal-text" />
        </h4>
        <div class="row" v-if="gameStatusNo!==7">
          <div class="col s12 m6 offset-m3">
            <div class="card teal darken-1">
              <div class="card-content white-text center">
                <span class="card-title">Oyun Bitti {{ winnerPlayer ? "var" : "yok" }}</span>
                <p>{{ description }}</p>
                <p v-if="gameStatusNo===6">Oyun berabere kaldı.</p>
               
                <p style="margin-top:1em;"
                  v-else-if="winnerPlayer"
                >
                
                Kazanan Oyuncu: {{winnerPlayer == currentUser.email ? currentUser.username : opponent.username }}</p>
              </div>
              <hr />
              <div class="card-content white-text center modal-skor-durum">
                <span class="card-title">Skor Durumu</span>
                <div class="row">
                  <div class="col s12 m6">
                    <p>
                      <font-awesome-icon :icon="['fas', 'user']" class="font-awesome-size" />
                    </p>
                    <p>{{ currentUser.username }}</p>
                    <p>{{ currentUserSkor}}</p>
                  </div>
                  <div class="col s12 m6">
                    <p>
                      <font-awesome-icon :icon="['fas', 'user']" class="font-awesome-size" />
                    </p>
                      <p>{{ opponent.username }}</p>
                    <p>{{ opponentScore}}</p>
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
                <p>{{ opponent.username+" oyundan çıkış yaptı." }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button
          v-if="gameStatusNo===5 || gameStatusNo===6 || gameStatusNo===8"
          class="btn purple darken-3 waves-green"
          @click="newGame"
        >Yeni Oyun</button>
        <button class="btn red btn-red" @click="exitGame">Oyundan Çık</button>
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
  props: ["winnerPlayer", "currentUserSkor", "opponentScore", "gameStatusNo"],
  data() {
    return {
      animatedCSS: true,
      opponent: null,
      description: null
    };
  },
  created() {
    this.currentUser = this.$session.get("user");
    this.opponent = this.$session.get("opponentUser");
    if (this.gameStatusNo === 3) {
      this.description =
        "Rakip oyuncu " +
        this.opponent.username +
        " oyundan çıkış yaptığın için hükmen mağlup oldu.";
    } else if (this.gameStatusNo === 4) {
      this.description =
        "1 dakikalık bekleme süresi sonucunda rakip oyuncu " +
        this.opponent.username +
        " oyuna giriş yapmadığından dolayı hükmen mağlup oldu";
    } else if (this.gameStatusNo === 8 && this.winnerPlayer !== null) {
      this.description = this.getLoserDescription;
    }
  },
  computed: {
    getLoserDescription: function() {
      if (this.winnerPlayer === this.currentUser.email) {
        return (
          "Rakibiniz " +
          this.opponent.username +
          " , 3 defa hamle sırası gelmesine rağmen hamle yapmadığı için oyunu kaybetti."
        );
      } else {
        return "3 defa hamle sıranız gelmesine rağmen hamle yapmadığınız için oyunu kaybettiniz!";
      }
    }
  },
  watch: {
    winnerPlayer: function(value) {
      if (this.gameStatusNo === 8 && value !== null) {
        this.description = this.getLoserDescription;
      }
    }
  },
  methods: {
    newGame() {
      this.animatedCSS = false;
      setTimeout(() => {
        this.$emit("newGame");
      }, 500);
    },
    exitGame() {
      this.animatedCSS = false;
      setTimeout(() => {
        this.$emit("exitGame");
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