<template>
  <div  >
    <div
  
      class="modal mobile-modal red animated bounceInDown"
    >
      <div class="modal-content center white-text">
        <h5>Lütfen cihazını çevirin!</h5>
      </div>
    </div>
    <div
      class="modal-overlay mobile-modal-overlay animated bounceInDown"
    ></div>
  </div>
</template>

<script>
export default {
  name: "MobileWarningModal",
  data() {
    return {
    };
  },
};
</script>
 <style>
 .mobile-modal{
height: 50%;
top:25%;
display: flex;
align-items: center;
justify-content: center;
}
.mobile-modal-overlay{
  opacity: .9;
}
 </style>