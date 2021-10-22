const fs = require('fs').promises;
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

// get input and output directory as params from command line


fs.readFile('capture.svg', 'utf-8').then(xml => {
  return new parser.parseStringPromise(xml);
}).then(obj => {
  // modify svg
  const width = obj.svg.$.viewBox.split(' ')[2];
  setWidthOnSvg(obj.svg.$);
  removeFillAttributeFromPath(obj.svg.path);
  // build into new svg
  const builder = new xml2js.Builder();
  const xml = builder.buildObject(obj);
  // build into vue template
  const template = convertSvgToVue(xml, width, 'Capture');
  fs.writeFile('IconCapture.vue', template);
}).catch(error => {
  console.log('error', error);
})

/**
 * remove height attribute from svg
 */
const setWidthOnSvg = (svg) => {
  delete svg.height;
  svg.width = 'none';
}


/**
 * remove fill attribute from path
 */
const removeFillAttributeFromPath = (paths) => {
  paths.forEach(path => {
    delete path.$.fill;
  })
}

/**
 * convert svg to vue template
 */
const convertSvgToVue = (svg, width, name) => {
  // add width/fill variables to svg
  let processedSvg = svg;
  const xmlHead = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  processedSvg = processedSvg.replace(xmlHead, '');
  processedSvg = processedSvg.replace('width="none"', ':width="width"');
  processedSvg = processedSvg.replace('fill="none"', ':fill="fill"');
  // adjust indentation for svg and path

  const template = `<template>\n${processedSvg}\n</template>`;
  const script = `\n<script lang='ts'>
  import { defineComponent } from 'vue';
  export default defineComponent({
    name: 'Icon${name}',
    props: {
      size: Number,
      color: String
    },
    computed: {
      width: function() {
        return this.size || ${width}
      },
      fill: function() {
        return this.color || '#FFF'
      }
    }
  })\n</script>`
  return template.concat(script);
}
