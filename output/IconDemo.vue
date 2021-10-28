<template>
<svg :width="width" :fill="fill" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#a)">
    <path d="M10.42 6.22a3.34 3.34 0 0 0 0-4.72 3.34 3.34 0 0 0-4.72 0 3.343 3.343 0 0 0-.46 4.142L.834 9.997a.736.736 0 0 0 1.04 1.04l.166-.167.7.7a.5.5 0 0 0 .705.018.5.5 0 0 0-.018-.706l-.014-.014a.17.17 0 0 1 0-.241l.192-.192a.17.17 0 0 1 .241 0l.014.014a.5.5 0 0 0 .706.018.5.5 0 0 0-.019-.705l-.7-.7 2.43-2.38c1.29.814 3.02.66 4.142-.463ZM6.732 5.187A1.878 1.878 0 1 1 9.39 2.53a1.878 1.878 0 0 1-2.657 2.657Z"/>
  </g>
  <defs>
    <clipPath id="a">
      <path d="M0 0h12v12H0z"/>
    </clipPath>
  </defs>
</svg>
</template>
<script lang='ts'>
  import { defineComponent } from 'vue';
  export default defineComponent({
    name: 'IconDemo',
    props: {
      size: Number,
      color: String
    },
    computed: {
      width: function() {
        return this.size || 12
      },
      fill: function() {
        return this.color || '#FFF'
      }
    }
  })
</script>