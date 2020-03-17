<template>
  <div id="game">
    <Navbar @openExitGameConfirmModal="openExitGameConfirmModal" />
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
            >{{ baslayanOyuncu==currentUser.email ? currentUserSkor : rakipSkor }}</span>
          </p>
        </div>

        <div class="col s4 offset-s1">
          <div class="msg z-depth-2 deep-purple darken-1 white-text">
            <span>Hamle yapacak oyuncu:{{ hamleSirasi==currentUser.email ? currentUser.username : rakip.username }}</span>
          </div>
        </div>

        <div class="col s3 offset-s1">
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
            >{{ baslayanOyuncu==currentUser.email ? rakipSkor: currentUserSkor }}</span>
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
        <span>Hamle yapamazsınız.</span>
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
          <span v-if="!beklemeSuresiDolduMu">Rakip oyuncu bekleniliyor...</span>
          <span>{{ countDown>0 ? ("00:"+(countDown>9 ? countDown : "0"+countDown)) : countDown==null ? "": "Süre Doldu!" }}</span>
        </div>
        <div class="msg z-depth-2" :class="msgTypeCSS" v-else-if="isOpenAlert">
          <span>Rakip oyuncu oyuna dahil oldu.Oyun başladı</span>
        </div>
      </div>
    </div>

    <notifications position="top center" group="alert" />

    <div v-if="oyunDurumNo===1 || oyunDurumNo===2">
      <ExitGameConfirmModal
        @oyunCikis="oyunCikis"
        :oyunDurumNo="oyunDurumNo"
        @modalClose="modalClose"
      />
    </div>
    <div v-else-if="oyunDurumNo>2 && oyunDurumNo<8">
      <GameOverModal
        @yeniOyun="yeniOyun"
        @oyunCikis="oyunCikis"
        :kazananOyuncu="kazananOyuncu"
        :currentUserSkor="currentUserSkor"
        :rakipSkor="rakipSkor"
        :oyunDurumNo="oyunDurumNo"
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
import GameOverModal from "@/components/GameOverModal";
import ExitGameConfirmModal from "@/components/ExitGameConfirmModal";
import HamleSoundFile from "@/assets/sound/hamle.mp3";
import WinnerSoundFile from "@/assets/sound/winner.mp3";

export default {
  name: "Game",
  components: {
    Navbar,
    GameOverModal,
    ExitGameConfirmModal
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
      rakipSkor: null,
      currentUserSkor: null,
      isOpenAlert: false,
      oyuncuKadroTamamMi: false,
      modalName: null,
      oyunBittiMi: false,
      timeoutHandle: null,
      countDown: null,
      oyunDurumNo: null,
      beklemeSuresiDolduMu: false
    };
  },
  created() {
    this.currentUser = this.$session.get("user");
    this.updatePlayersPlayingStatus(true);
    this.oyunNo = this.$session.get("oyunNo");
    this.whichPlayerStart();
    this.rakip = this.$session.get("rakipOyuncu");
    this.hamlelerListele();
    this.kazananOyuncuGetir();
    this.kazananOyuncuSifirla();
    this.skorGetir();
    this.oyuncuKadroTamamlandiMi();
    this.rakipOyuncuBeklemeSuresiGoster();
  },
  methods: {
    updatePlayersPlayingStatus(status) {
      let ref = db.collection("game_users");
      ref.doc(this.currentUser.email).update({
        is_play: status
      });
    },
    hamleSoundEfeck() {
      var snd = new Audio(HamleSoundFile);
      snd.play();
    },
    WinnerSoundEfeck() {
      var snd = new Audio(WinnerSoundFile);
      snd.play();
    },
    rakipOyuncuBeklemeSuresiGoster() {
      window.clearTimeout(this.timeoutHandle);
      let ref = db.collection("game_waits");
      ref.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "modified" || change.type == "added") &&
            change.doc.data().oyunNo == this.oyunNo
          ) {
            if (!this.oyuncuKadroTamamMi && this.oyunDurumNo == null) {
              let simdikiZaman = change.doc.data().simdikiZaman.seconds;
              let bitisTarih = change.doc.data().bitisTarih.seconds;
              let kalanSure = bitisTarih - simdikiZaman;
              if (kalanSure >= 0) {
                this.countDown = kalanSure <= 45 ? kalanSure : null;
                this.countDownTimerId = change.doc.id;
                this.timeoutHandle = setTimeout(() => {
                  console.log("devam ediliyor.");
                  db.collection("game_waits")
                    .doc(this.countDownTimerId)
                    .get()
                    .then(doc => {
                      if (doc.exists) {
                        db.collection("game_waits")
                          .doc(this.countDownTimerId)
                          .update({
                            simdikiZaman: new Date()
                          });
                      }
                    });
                }, 1000);
              } else {
                this.beklemeSuresiDolduMu = true;
                this.oyunBeklemeSuresiSil();
                this.kazananOyuncuEkle(this.currentUser.email);
                this.skorArtir(this.rakip.email);
                setTimeout(() => {
                  this.oyunDurumNo = 4;
                }, 2000);
              }
            }
          }
        });
      });
    },
    oyuncuKadroTamamlandiMi() {
      db.collection("game_rooms")
        .where("oyunNo", "==", this.oyunNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (
              (change.type == "modified" || change.type == "added") &&
              change.doc.data().oyuncuKadroTamamMi
            ) {
              if (this.oyuncuKadroTamamMi == false) {
                this.isOpenAlert = true;
                this.oyuncuKadroTamamMi = true;
                this.oyunBeklemeSuresiSil();
                this.oyunDurumNo = 0;
                this.scaleCSS = "scale-out";

                window.setTimeout(() => {
                  this.msgTypeCSS = "msg-info";
                  this.scaleCSS = "scale-in";
                }, 1000);

                window.setTimeout(() => {
                  this.scaleCSS = "scale-out";
                }, 3000);
              }
            } else if (
              (change.type === "added" || change.type === "modified") &&
              change.doc.data().oyunDurumNo == 1
            ) {
              this.oyunDurumNo = 3;
            } else if (
              (change.type === "added" || change.type === "modified") &&
              change.doc.data().oyunDurumNo === 7
            ) {
              this.oyunDurumNo = change.doc.data().oyunDurumNo;
            }

            if (
              (change.type == "added" || change.type == "modified") &&
              change.doc.data().oyunDurumNo == 5
            ) {
              this.oyunDurumNo = change.doc.data().oyunDurumNo;
            } else if (
              (change.type == "added" || change.type == "modified") &&
              change.doc.data().oyunDurumNo == 6
            ) {
              this.oyunDurumNo = change.doc.data().oyunDurumNo;
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
    openExitGameConfirmModal() {
      if (this.oyuncuKadroTamamMi) {
        this.oyunDurumNo = 1;
      } else {
        this.oyunDurumNo = 2;
      }
    },
    modalClose() {
      this.oyunDurumNo = null;
    },
    oyunCikis() {
      this.updatePlayersPlayingStatus(false);
      if (this.oyunDurumNo == 1) {
        this.oyuncuKadroDegistir(false);
        this.oyuncuDurumNoDegistir(1);
        this.bildirimSil();
        this.kazananOyuncuEkle(this.rakip.email);
        this.skorArtir(this.rakip.email);
      } else if (this.oyunDurumNo === 2) {
        this.oyunDurumNo = 0;
        this.bildirimSil();
        this.oyunSil();
        this.oyunBeklemeSuresiSil();
      } else if (this.oyunDurumNo === 3) {
        this.oyunHamleSil();
        this.oyunSil();
      } else if (this.oyunDurumNo === 4) {
        this.bildirimSil();
        this.oyunHamleSil();
        this.oyunSil();
      } else if (this.oyunDurumNo === 5 || this.oyunDurumNo === 6) {
        this.oyuncuKadroDegistir(false);
        this.oyuncuDurumNoDegistir(7);
        this.bildirimSil();
      } else if (this.oyunDurumNo === 7) {
        this.oyunHamleSil();
        this.bildirimSil();
        this.oyunSil();
      }
      this.oyunSessionSil();
      this.$router.push({ name: "Home" });
    },
    bildirimSil() {
      let rakip = this.$session.get("rakipOyuncu");
      db.collection("notifications")
        .where("senderEmail", "in", [this.currentUser.email, rakip.email])
        .get()
        .then(notifications => {
          notifications.forEach(notification => {
            db.collection("notifications")
              .doc(notification.id)
              .delete();
          });
        })
        .then(() => {
          db.collection("notifications")
            .where("receiverEmail", "in", [this.currentUser.email, rakip.email])
            .get()
            .then(notifications => {
              notifications.forEach(notification => {
                db.collection("notifications")
                  .doc(notification.id)
                  .delete();
              });
            });
        });
    },
    oyunBeklemeSuresiSil() {
      db.collection("game_waits")
        .where("oyunNo", "==", this.oyunNo)
        .get()
        .then(docs => {
          docs.forEach(doc => {
            db.collection("game_waits")
              .doc(doc.id)
              .delete();
          });
        });
    },
    oyuncuKadroDegistir(status) {
      db.collection("game_rooms")
        .doc(this.oyunNo)
        .update({
          oyuncuKadroTamamMi: status
        });
    },
    oyuncuDurumNoDegistir(no) {
      db.collection("game_rooms")
        .doc(this.oyunNo)
        .update({
          oyunDurumNo: no
        });
    },
    oyunSil() {
      db.collection("game_rooms")
        .doc(this.oyunNo)
        .delete();
    },
    oyunSessionSil() {
      this.$session.remove("rakipOyuncu");
      this.$session.remove("oyunNo");
    },
    oyunHamleSil() {
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
      this.oyuncuDurumNoDegistir(0);
      this.isOpenAlert = false;
      this.oyunBittiMi = false;
      this.oyunDurumNo = null;
      this.hamleler = [];
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
      this.hamleSoundEfeck();
      const col = parseInt(event.toElement.attributes.col.value);
      let enAltSatir = this.altSatirBul(col);
      if (enAltSatir) {
        this.row = enAltSatir;
        this.col = col;
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
              let doc = change.doc.data();

              let hamleIndex = this.hamleler.findIndex(hamle => {
                return hamle.row == doc.row && hamle.col == doc.col;
              });

              if (hamleIndex === -1) {
                this.hamleler.push({
                  row: doc.row,
                  col: doc.col,
                  renk: doc.renk
                });
                this.aktifTakim = doc.aktifTakim;
                this.takimNo = doc.takimNo;
                this.takimHamleSayisiArtir();
              }
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
      db.collection("hamleler")
        .orderBy("timestamp")
        .limitToLast(1)
        .get()
        .then(() => {
          this.oyunuKazandiMi(this.row, this.col);
        });
    },
    hamleKaydet() {
      let hamleVarmi = this.hamleler.findIndex(hamle => {
        return hamle.row == this.row && hamle.col == this.col;
      });

      if (hamleVarmi === -1) {
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
      }
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
      }

      hucreSayisi = this.caprazYukariSagKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
      }

      hucreSayisi = 0;
      hucreSayisi = this.caprazAsagiSagKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
      }

      hucreSayisi = this.caprazYukariSolKontrol(satirNo, sutunNo, hucreSayisi);
      if (this.dortluTamamlandimi(hucreSayisi)) {
        this.oyunTamamlandi();
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
    kazananOyuncuEkle(oyuncu) {
      db.collection("game_rooms")
        .doc(this.oyunNo)
        .update({
          kazananOyuncu: oyuncu
        });
    },
    kazananOyuncuSifirla() {
      if (this.kazananOyuncu) {
        db.collection("game_rooms")
          .doc(this.oyunNo)
          .update({
            kazananOyuncu: null
          });
      }
    },
    kazananOyuncuGetir() {
      let ref = db.collection("game_rooms");
      ref.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "modified" || change.type == "added") &&
            change.doc.id == this.oyunNo &&
            change.doc.data().kazananOyuncu &&
            change.doc.data().oyunDurumNo === 5
          ) {
            this.kazananOyuncu = change.doc.data().kazananOyuncu;
            if (change.doc.data().oyuncuKadroTamamMi) {
              this.WinnerSoundEfeck();
            }
          }
        });
      });
    },
    skorArtir(oyuncuEmail) {
      db.collection("scores")
        .where("email", "==", oyuncuEmail)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            db.collection("scores")
              .doc(doc.id)
              .update({
                score: doc.data().score + 10
              });
          });
        });
    },
    skorGetir() {
      db.collection("scores").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "added" || change.type == "modified") &&
            change.doc.data().email == this.currentUser.email
          ) {
            this.currentUserSkor = change.doc.data().score;
          } else if (
            (change.type == "added" || change.type == "modified") &&
            change.doc.data().email == this.rakip.email
          ) {
            this.rakipSkor = change.doc.data().score;
          }
        });
      });
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
    takimHamleSayisiArtir() {
      if (this.takimNo == 1) {
        this.kirmiziHamleSayisi++;
      } else if (this.takimNo == 2) {
        this.yesilHamleSayisi++;
      }
    },
    oyunTamamlandi() {
      this.oyunBittiMi = true;
      this.oyuncuDurumNoDegistir(5);
      this.kazananOyuncuEkle(this.currentUser.email);
      this.skorArtir(this.currentUser.email);
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
        if (!this.oyunBittiMi) this.yatayKontrol(satir, sutun);
        if (!this.oyunBittiMi) this.caprazKontrol(satir, sutun);
      }
      console.log(this.hamleler.length);
      console.log(this.kazananOyuncu);
      if (this.kazananOyuncu == null && this.hamleler.length == 48) {
        this.kazananOyuncuEkle(false);
        this.oyunBittiMi = true;
        this.oyuncuDurumNoDegistir(6);
      }
    }
  }
};
</script>

<style lang="css" scoped>
@import "../assets/css/dortleme.css";
</style>