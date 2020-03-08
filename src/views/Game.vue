<template>
  <div id="game">
    <Navbar />
    <button @click="dbreset">Sıfırla</button>

    <div class="container center">
      <div class="row">
        <div class="col s3">
          <p
            class="z-depth-1 white-text bg-red card-red-team"
            :class="hamleSirasi==baslayanOyuncu ? 'aktif-takim-border' : ''"
          >
            <span
              class="player-name"
            >{{ baslayanOyuncu==currentUser.email ? currentUser.username : rakip.username }}</span>
            <font-awesome-icon :icon="['fas', 'user']" />
            <span
              class="btn-floating waves-effect waves-light skor skor-bg-red"
            >{{ baslayanOyuncu==currentUser.email ? skor[currentUser.username] : skor[rakip.username] }}</span>
          </p>
        </div>

        <div class="col s3 offset-s6">
          <p
            class="z-depth-1 white-text bg-green card-green-team"
            :class="hamleSirasi!=baslayanOyuncu ? 'aktif-takim-border' : ''"
          >
            <font-awesome-icon :icon="['fas', 'user']" />
            <span
              class="player-name"
            >{{ baslayanOyuncu==currentUser.email ? rakip.username : currentUser.username }}</span>
            <span
              class="btn-floating waves-effect waves-light bg-green skor"
            >{{ baslayanOyuncu==currentUser.email ? skor[rakip.username] : skor[currentUser.username] }}</span>
          </p>
        </div>
      </div>
    </div>

    <div
      class="dortleme-container"
      :class="hamleSirasi!=currentUser.email ? 'cursor-not-allowed tooltip' : ''"
    >
      <div
        class="tooltiptext"
        :style="hamleSirasi!=currentUser.email ? 'display:block' : 'display:none'"
      >
        <span>Hamle sırası rakip oyuncuda.</span>
        <span>Hamle yapamassınız.</span>
      </div>

      <div class="dortleme" :class="hamleSirasi!=currentUser.email ? 'pointer-events-none ' : ''">
        <div v-for="row in 6" :key="row" class="row-container">
          <div v-for="col in 8" :key="col">
            <div @click="hamle" :class="renkYerlestir(row,col)" class="hucre" :row="row" :col="col"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="alert-bottom-container">
      <div class="alert-bottom scale-transition" :class="scaleCSS">
        <div class="msg z-depth-2" :class="msgTypeCSS" v-if="!isOpenAlert">
          <span>Rakip oyuncu beklenmektedir.</span>
        </div>
        <div class="msg z-depth-2" :class="msgTypeCSS" v-else-if="isOpenAlert">
          <span>Rakip oyuncu oyuna dahil oldu.Oyun başladı</span>
        </div>
      </div>
    </div>

    <notifications position="top center" group="alert" />

    <div v-if="isOpenModal">
      <GameModal
        @modalClose="modalClose"
        @yeniOyun="yeniOyun"
        :kazananOyuncu="kazananOyuncu"
        :skor="skor"
      />
    </div>
  </div>
</template>


<script>
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
library.add(faUser);

import db from "@/firebase/init";
import Navbar from "@/components/Navbar";
import GameModal from "@/components/GameModal";

export default {
  name: "Game",
  components: {
    Navbar,
    GameModal
  },
  data() {
    return {
      aktifTakim: null,
      takimNo: null,
      hamleler: [],
      yesilHamleSayisi: 0,
      kirmiziHamleSayisi: 0,
      row: null,
      col: null,
      renk: null,
      rakip: null,
      user: null,
      oyunNo: null,
      scaleCSS: "scale-in",
      msgTypeCSS: "msg-error",
      baslayanOyuncu: null,
      hamleSirasi: null,
      kazananOyuncu: null,
      skor: {},
      skorArtirilsinMi: true,
      isOpenModal: false,
      isOpenAlert: false,
      oyuncuKadroTamamMi: false
    };
  },
  created() {
    this.currentUser = this.$session.get("user");
    this.oyunNo = this.$session.get("oyunNo");
    this.whichPlayerStart();
    this.rakip = this.$session.get("rakipOyuncu");
    this.hamlelerListele();
    this.kazananOyuncuGetir();
    this.kazananOyuncuSifirla();
    this.skorGetir();
    this.oyuncuKadroTamamlandiMi();
  },
  methods: {
    oyuncuKadroTamamlandiMi() {
      db.collection("game_rooms")
        .where("oyunNo", "==", this.oyunNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (
              (change.type == "modified" || change.type == "added") &&
              change.doc.data().oyuncuKadroTamamMi == true
            ) {
              if (!this.oyuncuKadroTamamMi) {
                this.isOpenAlert = true;
                this.oyuncuKadroTamamMi = true;
                this.scaleCSS = "scale-out";

                window.setTimeout(() => {
                  this.msgTypeCSS = "msg-info";
                  this.scaleCSS = "scale-in";
                }, 1000);

                window.setTimeout(() => {
                  this.scaleCSS = "scale-out";
                }, 3000);
              }
            }
          });
        });
    },
    notificationAlert(title, text) {
      this.$notify({
        group: "alert",
        title: title,
        text: text,
        type: "warn"
      });
    },
    modalClose() {
      this.isOpenModal = false;
    },
    yeniOyun() {
      db.collection("hamleler")
        .where("oyunNo", "==", this.oyunNo)
        .get()
        .then(hamleler => {
          hamleler.forEach(doc => {
            db.collection("hamleler")
              .doc(doc.id)
              .delete();
          });
        });
      this.kazananOyuncuSifirla();
      this.isOpenAlert = false;
      this.hamleler = [];
    },
    getWinnerUsername() {
      if (this.kazananOyuncu == this.rakip.email) {
        this.kazananOyuncu = this.rakip.username;
      } else {
        this.kazananOyuncu = this.currentUser.username;
      }
    },
    whichPlayerStart() {
      let ref = db.collection("game_rooms").doc(this.oyunNo);
      ref
        .get()
        .then(doc => {
          this.baslayanOyuncu = doc.data().oyunuBaslatanEmail;
          this.hamleSirasi = doc.data().oyunuBaslatanEmail;
        })
        .then(() => {
          if (this.hamleSirasi == this.currentUser.email) {
            this.aktifTakim = 1;
          } else {
            this.aktifTakim = 2;
          }
        })
        .then(() => {
          this.hamleSırasiGetir();
        });
    },
    hamle(event) {
      const col = parseInt(event.toElement.attributes.col.value);
      let enAltSatir = this.altSatirBul(col);
      if (enAltSatir) {
        this.row = enAltSatir;
        this.col = col;
        this.hamleSayiArtir();
        this.renk = this.takimRenkGetir();
        this.takimNo = this.aktifTakim;
        this.takimDegistir();
        this.hamleKaydet();
        this.hamleSirasiDegistir();
      } else {
        this.notificationAlert("Uyarı", "Hamle yapmak istediğiniz satir dolu.");
      }
    },
    hamlelerListele() {
      db.collection("hamleler")
        .where("oyunNo", "==", this.oyunNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type == "added") {
              let doc = change.doc;
              this.hamleler.push({
                row: doc.data().row,
                col: doc.data().col,
                renk: doc.data().renk
              });
              this.aktifTakim = doc.data().aktifTakim;
              this.takimNo = doc.data().takimNo;
            }
          });
        });
    },
    hamleSirasiDegistir() {
      var ref = db.collection("game_rooms").doc(this.oyunNo);
      ref.update({
        hamleSirasi: this.rakip.email
      });
    },
    hamleSırasiGetir() {
      db.collection("game_rooms")
        .where("oyunNo", "==", this.oyunNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type == "modified" || change.type == "added") {
              this.hamleSirasi = change.doc.data().hamleSirasi;
            }
          });
        });
    },
    sonHamleGetir() {
      let scope = this;
      db.collection("hamleler")
        .orderBy("timestamp")
        .limitToLast(1)
        .get()
        .then(
          function(prevSnapshot) {
            var lastRecord = [];
            prevSnapshot.docChanges().forEach(change => {
              let doc = change.doc.data();
              if (doc.oyunNo == scope.oyunNo) {
                lastRecord.push({
                  row: doc.row,
                  col: doc.col,
                  renk: doc.renk,
                  aktifTakim: doc.aktifTakim,
                  takimNo: doc.takimNo
                });
              }
            });
            return Promise.all(lastRecord);
          },
          function(error) {
            console.error(error);
          }
        )
        .then(function(values) {
          let value = values[0];
          scope.hamleler.push({
            row: value.row,
            col: value.col,
            renk: value.renk
          });
          scope.aktifTakim = value.aktifTakim;
          scope.takimNo = value.takimNo;
        })
        .then(() => {
          this.oyunuKazandiMi(this.row, this.col);
        });
    },
    hamleKaydet() {
      db.collection("hamleler")
        .add({
          row: this.row,
          col: this.col,
          renk: this.renk,
          takimNo: this.takimNo,
          aktifTakim: this.aktifTakim,
          oyunNo: this.oyunNo,
          timestamp: Date.now()
        })
        .then(() => {
          this.sonHamleGetir();
        });
    },
    dbreset() {
      this.hamleler = [];
      var jobskill_query = db
        .collection("hamleler")
        .where("oyunNo", "==", this.oyunNo);
      jobskill_query.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          doc.ref.delete();
        });
      });
    },
    caprazKontrol(satirNo, sutunNo) {
      let hucreSayisi = 0;

      hucreSayisi = this.caprazAsagiSolKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
        return true;
      }

      hucreSayisi = this.caprazYukariSagKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
        return true;
      }

      hucreSayisi = 0;
      hucreSayisi = this.caprazAsagiSagKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
        return true;
      }

      hucreSayisi = this.caprazYukariSolKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
        return true;
      }
    },
    caprazYukariSolKontrol(satirNo, sutunNo, hucreSayisi) {
      let renkKodu = 0;
      satirNo--;
      for (let sutun = sutunNo - 1; sutun > 0; sutun--) {
        renkKodu = this.hucreRenginiGetir(satirNo, sutun);
        if (renkKodu == this.takimNo) {
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
        satirNo--;
      }
      return hucreSayisi;
    },
    caprazAsagiSagKontrol(satirNo, sutunNo, hucreSayisi) {
      let renkKodu = 0;
      for (let sutun = sutunNo; sutun < 9; sutun++) {
        renkKodu = this.hucreRenginiGetir(satirNo, sutun);
        if (renkKodu == this.takimNo) {
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
        if (satirNo < 7) {
          satirNo++;
        }
      }
      return hucreSayisi;
    },
    caprazAsagiSolKontrol(satirNo, sutunNo, hucreSayisi) {
      let renkKodu = 0;
      for (let sutun = sutunNo; sutun > 0; sutun--) {
        renkKodu = this.hucreRenginiGetir(satirNo, sutun);
        if (renkKodu == this.takimNo) {
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
        if (satirNo < 7) {
          satirNo++;
        }
      }
      return hucreSayisi;
    },
    caprazYukariSagKontrol(satirNo, sutunNo, hucreSayisi) {
      let renkKodu = 0;
      satirNo--;
      for (let sutun = sutunNo + 1; sutun < 9; sutun++) {
        renkKodu = this.hucreRenginiGetir(satirNo, sutun);
        if (renkKodu == this.takimNo) {
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
        if (satirNo > 0) {
          satirNo--;
        }
      }
      return hucreSayisi;
    },
    dikeyKontrol(satirNo, sutunNo) {
      let hucreSayisi = this.dikeyYukaridanKontrol(satirNo, sutunNo);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
      }
    },
    dikeyYukaridanKontrol(satirNo, sutunNo) {
      let hucreSayisi = 0,
        renkKodu = 0;
      for (let index = satirNo; index < 7; index++) {
        renkKodu = this.hucreRenginiGetir(index, sutunNo);
        if (renkKodu == this.takimNo) {
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
      }
      return hucreSayisi;
    },
    yatayKontrol(satirNo, sutunNo) {
      let hucreSayisi = this.yataySoldanKontrol(satirNo, sutunNo);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
      } else {
        hucreSayisi = this.yataySagdanKontrol(hucreSayisi, satirNo, sutunNo);
        if (this.dortluTamamlandimi(hucreSayisi)) {
          this.oyunTamamlandi();
        }
      }
    },

    yataySagdanKontrol(hucreSayisi, satirNo, sutunNo) {
      let renkKodu = 0;
      for (let index = sutunNo + 1; index < 9; index++) {
        renkKodu = this.hucreRenginiGetir(satirNo, index);
        if (renkKodu == this.takimNo) {
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
      }
    },
    yataySoldanKontrol(satirNo, sutunNo) {
      let hucreSayisi = 0,
        renkKodu = 0;
      for (let index = sutunNo; index > 0; index--) {
        renkKodu = this.hucreRenginiGetir(satirNo, index);
        if (renkKodu == this.takimNo) {
          hucreSayisi++;
          if (this.dortluTamamlandimi(hucreSayisi)) {
            return 4;
          }
        } else {
          return hucreSayisi;
        }
      }
      return hucreSayisi;
    },
    takimRenkGetir() {
      if (this.aktifTakim == 1) {
        return "bg-red animated bounceInDown";
      } else if (this.aktifTakim == 2) {
        return "bg-green  animated bounceInDown";
      }
    },
    dortluTamamlandimi(hucreSayisi) {
      if (hucreSayisi == 4) {
        return true;
      } else {
        return false;
      }
    },
    kazananOyuncuEkle() {
      var ref = db.collection("game_rooms").doc(this.oyunNo);
      ref.update({
        kazananOyuncu: this.currentUser.email
      });
    },
    kazananOyuncuSifirla() {
      if (this.kazananOyuncu) {
        db.collection("game_rooms")
          .doc(this.oyunNo)
          .update({
            kazananOyuncu: null
          });
        this.isOpenModal = false;
      }
    },
    kazananOyuncuGetir() {
      let ref = db.collection("game_rooms");
      ref.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "modified" || change.type == "added") &&
            change.doc.id == this.oyunNo &&
            change.doc.data().kazananOyuncu
          ) {
            this.kazananOyuncu = change.doc.data().kazananOyuncu;
            this.getWinnerUsername();
            this.skor = change.doc.data().skor;
            this.isOpenModal = true;
          }
        });
      });
    },
    skorArtir() {
      let playerIndex = this.skor.findIndex(player => {
        return player.username === this.currentUser.username;
      });
      this.skor[playerIndex].puan += 1;
      var ref = db.collection("game_rooms").doc(this.oyunNo);
      ref.update({
        skor: this.skor
      });
    },
    skorGetir() {
      db.collection("game_rooms").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type == "added" && change.doc.id == this.oyunNo) {
            this.skor = change.doc.data().skor;
          }
        });
      });
      this.skorArtirilsinMi = true;
    },
    altSatirBul(sutun) {
      for (let index = 6; index > 0; index--) {
        let hucreKullanilmaDurumu = this.hucreKullanildiMi(index, sutun);
        if (!hucreKullanilmaDurumu) {
          return index;
        }
      }
      return false;
    },
    hucreKullanildiMi(index, sutunNo) {
      if (this.hucreRenginiGetir(index, sutunNo) > 0) {
        return true;
      } else {
        return false;
      }
    },
    hucreRenginiGetir(row, col) {
      const hucre = this.hamleler.find(
        element => element.row == row && element.col == col
      );
      if (hucre) {
        if (hucre.renk.includes("bg-red")) {
          return 1;
        } else if (hucre.renk.includes("bg-green")) {
          return 2;
        } else {
          return 0;
        }
      }
    },
    renkYerlestir(row, col) {
      const hucre = this.hamleler.find(
        element => element.row == row && element.col == col
      );
      if (hucre) {
        return hucre.renk;
      }
      return "";
    },
    takimDegistir() {
      if (this.aktifTakim == 1) {
        this.aktifTakim = 2;
      } else if (this.aktifTakim == 2) {
        this.aktifTakim = 1;
      }
    },
    hamleSayiArtir() {
      if (this.aktifTakim == 1) {
        this.kirmiziHamleSayisi++;
      } else if (this.aktifTakim == 2) {
        this.yesilHamleSayisi++;
      }
    },
    oyunTamamlandi() {
      this.kazananOyuncuEkle();
      this.skorArtir();
    },

    oyunuKazandiMi(satir, sutun) {
      var kontrolYapilsinmi = false;
      if (this.takimNo == 1) {
        if (this.kirmiziHamleSayisi >= 4) {
          kontrolYapilsinmi = true;
        }
      } else if (this.takimNo == 2) {
        if (this.yesilHamleSayisi >= 4) {
          kontrolYapilsinmi = true;
        }
      }
      if (kontrolYapilsinmi) {
        this.dikeyKontrol(satir, sutun);
        this.yatayKontrol(satir, sutun);
        this.caprazKontrol(satir, sutun);
      }
    }
  }
};
</script>

<style lang="css" scoped>
@import "../../src/assets/css/dortleme.css";
</style>