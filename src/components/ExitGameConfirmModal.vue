

<template>
  <div class="exit-game-confirm-modal">
    <div id="modal1" class="modal"   :class="animatedCSS ? 'animated bounceInDown': 'animated bounceOutUp'">
      <div class="modal-content">
        <h4>Uyarı</h4>
        <p>Oyundan çıkmak istediğinize emin misiniz ?</p>
        <p>{{ gameStatusNo===1 ? "Oyundan çıkmanız halinde hükmen mağlup olacaksınız ve karşıdaki oyuncu oyunu kazanmış olacak." : null }}</p>
      </div>
      <div class="modal-footer">
         <button class="btn purple darken-3 waves-green" @click="modalClose">Hayır</button>
         <button class="btn red btn-red" @click="exitGame">Evet</button>
      </div>
    </div>
    <div
      class="modal-overlay"
      :class="animatedCSS ? 'animated bounceInDown': 'animated bounceOutUp'"
    ></div>
  </div>
</template>

<script>

export default {
  name:'ExitGameConfirmModal',
  props:['gameStatusNo'],
  data() {
    return {
      animatedCSS: true,
    };
  },
  methods: {
     modalClose() {
     this.animatedCSS = false;
     setTimeout(() => {
       this.$emit("modalClose");
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
.modal-footer {
  text-align: center !important;
}
</style>