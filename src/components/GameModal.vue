

<template>
  <div id="game-modal">
    <div
      id="modal1"
      class="modal"
      :class="animatedCSS ? 'animated bounceInDown': 'animated bounceOutUp'"
      tabindex="0"
    >
      <div class="modal-content">
        <h4 class="center">
          <font-awesome-icon :icon="['fas', 'trophy']" class="font-awesome-size teal-text" />
        </h4>

        <div class="row">
          <div class="col s12 m6 offset-m3">
            <div class="card teal darken-1">
              <div class="card-content white-text center">
                <span class="card-title">Kazanan Oyuncu</span>
                <p>{{ kazananOyuncu }}</p>
              </div>
              <hr />
              <div class="card-content white-text center modal-skor-durum">
                <span class="card-title">Skor Durumu</span>
                <div class="row">
                  <div class="col s12 m6">
                    <p>
                      <font-awesome-icon :icon="['fas', 'user']" class="font-awesome-size" />
                    </p>
                    <p>{{ skor[kazananOyuncuIndex].username}}</p>
                    <p>{{ skor[kazananOyuncuIndex].puan}}</p>
                  </div>
                  <div class="col s12 m6">
                    <p>
                      <font-awesome-icon :icon="['fas', 'user']" class="font-awesome-size" />
                    </p>
                    <p> {{ skor[kaybedenOyuncuIndex].username }} </p>

                    <p>{{ skor[kaybedenOyuncuIndex].puan}}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn purple darken-3 waves-green" @click="yeniOyun">Yeni Oyun</button>
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
  props: ["kazananOyuncu", "skor"],
  data() {
    return {
      animatedCSS: true,
      rakip: null,
      kaybedenOyuncuIndex: null,
      kazananOyuncuIndex: null
    };
  },
  created() {
    this.currentUser = this.$session.get("user");
    this.rakip = this.$session.get("rakipOyuncu");
    this.getPlayerIndex();
  },
  mounted() {},
  methods: {
    getPlayerIndex() {
      this.kazananOyuncuIndex = this.skor.findIndex(player => {
        return player.username === this.kazananOyuncu;
      });
      if (this.kazananOyuncuIndex == 0) {
        this.kaybedenOyuncuIndex = 1;
      }else{
         this.kaybedenOyuncuIndex = 0;
      }
    },
    yeniOyun() {
      this.animatedCSS = false;
      setTimeout(() => {
        this.$emit("yeniOyun");
      }, 500);
    },
    oyundanCik() {
      this.animatedCSS = false;
      setTimeout(() => {
        this.$emit("oyundanCik");
      }, 500);
      //
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