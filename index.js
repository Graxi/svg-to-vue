const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

// TODO: get input and output directory as params from command line
const dir = './input/';
const filenames = fs.readdirSync(dir);
if (!filenames.length) {
  console.error('No files found');
  return;
}

const processFileName = (filename) => {
  const prefix = filename.split('.')[0].toLowerCase(); // remove .svg extension
  const processedFileName = prefix.split('-').map(str => {
    const capitalized = str[0].toUpperCase().concat(str.substr(1));
    return capitalized;
  }).join('');
  return processedFileName;
}

const tags = new Set();

// file name validation
filenames.forEach(async filename => {
  if (!/^[a-zA-Z-]+.svg/.test(filename)) {
    console.error(`${filename}: File name is invalid. Should only contain letters and -`);
    return;
  }
  console.log(`start processing ${filename}`);
  const processedFileName = processFileName(filename);
  const xml = fs.readFileSync(dir.concat(filename), 'utf-8');
  const obj = await new parser.parseStringPromise(xml);

  // modify svg
  const width = obj.svg.$.viewBox.split(' ')[2];
  cleanSourceSvgFile(obj.svg);
  // build into new svg
  const builder = new xml2js.Builder();
  const newXml = builder.buildObject(obj);
  // build into vue template
  const template = convertSvgToVue(newXml, width, processedFileName);
  fs.writeFileSync(`output/Icon${processedFileName}.vue`, template);
})

const cleanSourceSvgFile = (svg) => {
  // remove unnecessary title tag
  if (svg.title) delete svg.title;

  // reset width/height/fill
  delete svg.$.height;
  svg.$.width = 'none';
  svg.$.fill = 'none';

  // remove style attribute
  if (svg.$.style) delete svg.$.style;

  // 1) remove fill attribute from all descendant tags
  // 2) collect different descendant tags for indentation
  tags.add('svg');
  const traverseSvg = (obj) => {
    for(let key in obj) {
      if (key === '$') continue;
      // collect tag
      tags.add(key);

      const array = obj[key];
      for(let ele of array) {
        if (ele.$?.fill) delete ele.$.fill;
        traverseSvg(ele);
      }
    }
  }
  traverseSvg(svg);
}

/**
 * format svg
 */
const formatSvg = (svg) => {
  // add width/fill variables to svg
  let s = svg;
  // const xmlHead = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  if (/<?xml/.test(s)) {
    const lines = s.split('\n');
    lines.shift();
    s = lines.join('\n');
  }

  s = s.replace('width="none"', ':width="width"');
  s = s.replace('fill="none"', ':fill="fill"');

  // adjust indentation for svg and path
  tags.forEach(tag => {
    // indent opening tag
    s = s.replace(/<${tag}/ig, `\t<${tag}`);
    // indent closing tag
    s = s.replace(/<\/${tag}/ig, `\t<\/${tag}`);
  })
  return s;
}

/**
 * convert svg to vue template
 */
const convertSvgToVue = (svg, width, name) => {
  const template = `<template>\n${formatSvg(svg)}\n</template>`;
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
  const templateStr = template.concat(script);
  return templateStr;
}
