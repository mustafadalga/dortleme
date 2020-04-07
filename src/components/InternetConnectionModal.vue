

<template>
  <div class="internet-connection-modal">
    <div
      id="modal1"
      class="modal red"
      :class="animatedCSS ? 'animated bounceOutUp' : 'animated bounceInDown'"
    >
      <div class="modal-content center">
        <h5>İnternet Bağlantısı Kesildi</h5>
        <p>Lütfen internet bağlantınızı kontrol ediniz!</p>
      </div>
      <div class="modal-footer red mb">
        <button class="btn white red-text" @click="$router.go(0)">Sayfayı Yenile</button>
      </div>
    </div>
    <div
      class="modal-overlay"
      :class="animatedCSS ? 'animated bounceOutUp' : 'animated bounceInDown'"
    ></div>
  </div>
</template>

<script>
export default {
  name: "InternetConnectionModal",
  props: ["connectionStatus"],
  data() {
    return {
      animatedCSS: false
    };
  },
  created() {
    this.animatedCSS = this.connectionStatus;
  }
};
</script>

<style>
#modal1 {
  top: 25%;
}
.modal-overlay {
  z-index: 1002;
  display: block;
  opacity: 0.5;
}
.modal-content p,.modal-content h5{
  line-height: normal!important;
}
.mb{
  margin-bottom: 2em;
}
</style>