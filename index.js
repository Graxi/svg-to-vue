const { optimize } = require('svgo');
const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

let inputDir = './input'; // input directory by default
let outputDir = './output';

const arguments = process.argv;
if (arguments.length === 4) {
  inputDir = arguments[2];
  outputDir = arguments[3];
}

const tags = new Set();
let filenames;
try {
  filenames = fs.readdirSync(inputDir);
  if (!filenames.length) {
    console.error('No files found');
    return;
  }
} catch(error) {
  console.log(`${inputDir} doesn't exist`);
}

if (!filenames) return;

const processFileName = (filename) => {
  const prefix = filename.split('.')[0].toLowerCase(); // remove .svg extension
  const processedFileName = prefix.split('-').map(str => {
    const capitalized = str[0].toUpperCase().concat(str.substr(1));
    return capitalized;
  }).join('');
  return processedFileName;
}

// file name validation
filenames.forEach(async filename => {
  if (!/^[a-zA-Z-]+.svg$/.test(filename)) {
    console.error(`${filename}: Invalid svg file. File name should only contain letters and -`);
    return;
  }
  console.log(`start processing ${filename}`);
  const processedFileName = processFileName(filename);
  const svgString = fs.readFileSync(`${inputDir}/${filename}`, 'utf-8');
  const optimizedSvg = optimize(svgString); // optimize svg
  const obj = await new parser.parseStringPromise(optimizedSvg.data);

  // modify svg
  const width = optimizedSvg.info.width;
  cleanSourceSvgFile(obj.svg);
  // build into new svg
  const builder = new xml2js.Builder();
  const newXml = builder.buildObject(obj);
  // build into vue template
  const template = convertSvgToVue(newXml, width, processedFileName);
  fs.writeFileSync(`${outputDir}/Icon${processedFileName}.vue`, template);
})

const cleanSourceSvgFile = (svg) => {
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
      size: {
        type: Number,
        default: ${width}
      },
      color: {
        type: String,
        default: '#000'
      }
    },
    computed: {
      width: function() {
        return this.size
      },
      fill: function() {
        return this.color
      }
    }
  })\n</script>`
  const templateStr = template.concat(script);
  return templateStr;
}
