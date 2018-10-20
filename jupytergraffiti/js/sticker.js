define([], () => {
  // Thanks to https://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element
  const sticker = {

    // Cf : https://www.beyondjava.net/how-to-connect-html-elements-with-an-arrow-using-svg
    // and: https://stackoverflow.com/questions/43887340/how-to-include-the-arrow-head-in-the-length-of-a-line-in-svg
    generateArrowHeadElem: (arrowHeadColor, arrowHeadSize) => {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const marker = sticker.makeSvgElement('marker', {
        id:'arrowHead',
        viewBox: '0 0 10 10',
        refX: 8.7,
        refY: 3,
        markerUnits: 'strokeWidth',
        markerWidth: arrowHeadSize,
        markerHeight: arrowHeadSize,
        orient: 'auto',
        stroke: arrowHeadColor,
        fill: arrowHeadColor
      });
      const path = sticker.makeSvgElement('path', {
        d: "M 0,0 L0,6 L9,3 z"
      });
      marker.appendChild(path);
      defs.appendChild(marker);
      return defs;
    },
    
    makeElementHtml: (tag, attr, innerHtml) => {
      let svgHtml = '<' + tag + ' ';
      if (tag === 'svg') {
        svgHtml += 'xmlns="http://www.w3.org/2000/svg" version="1.1" class="graffitiSvg" ';
      }
      let attrHtml = '';
      if (attr !== undefined) {
        attrHtml = $.map(attr, (val, key) => { return (key + '="' + val + '"') } ).join(' ');
      }
      if (innerHtml !== undefined) {
        svgHtml += attrHtml + '>' + innerHtml + '</' + tag + '>';
      } else {
        svgHtml += attrHtml + '></' + tag + '>';
      }
      return svgHtml;
    },

    makeSvgElement: (tag, attrs) => {
      const el= document.createElementNS('http://www.w3.org/2000/svg', tag);
      if (tag === 'svg') {
        el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        el.setAttribute('version', '1.1');
        el.setAttribute('preserveAspectRatio', 'none')
      }
      for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
      }
      return el;
    },

    makeDomElement: (tag, attrs) => {
      const el= document.createElement(tag);
      for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
      }
      return el;
    },

    renderSvg: (svgChildren, x, y, width, height, viewBox) => {
      let containerDiv, containerSticker;
      let svgGenerator = $('#graffitiSvgGenerator');
      if (svgGenerator.length === 0) {
        $('body').append($('<div id="graffitiSvgGenerator"></div>'));
        svgGenerator = $('#graffitiSvgGenerator');
      }
      for (let svgChild of svgChildren) {
        let transform = '';
        if (svgChild.hasOwnProperty('cssTransform')) {
          transform = 'transform:' + svgChild.cssTransform;
        }
        containerDiv =
          sticker.makeDomElement('div',
                             {
                               'class':"graffiti-sticker-inner",
                               'style' : 'position:absolute;' +
                                         'left:' + parseInt(svgChild.x) + 'px;top:' + parseInt(svgChild.y) + 'px;' +
                                         'width:' + parseInt(svgChild.width) + 'px;height:' + parseInt(svgChild.height) + 'px;' +
                                         transform
                             });
        containerSticker =
          sticker.makeSvgElement('svg',
                             {
                               width: svgChild.width,
                               height: svgChild.height,
                               viewBox: svgChild.viewBox
                             });
        if (svgChild.usesArrow) {
          containerSticker.appendChild(sticker.generateArrowHeadElem(svgChild.color, svgChild.arrowHeadSize));
        }
        containerSticker.appendChild(svgChild.el);
        containerDiv.appendChild(containerSticker);
        svgGenerator[0].appendChild(containerDiv);
      }
      const containerHtml = svgGenerator[0].innerHTML;
      svgGenerator.empty();

      return containerHtml;
    },

    makeLine: (opts) => {
      const endpoints = opts.endpoints;
      const p1 = endpoints.p1;
      const p2 = endpoints.p2;
      const bbox = { 
        p1: {
          x: Math.min(p1.x, p2.x),
          y: Math.min(p1.y, p2.y)
        }, 
        p2: {
          x: Math.max(p1.x, p2.x),
          y: Math.max(p1.y, p2.y)
        }
      };
      const color = (opts.color === undefined ? '#000' : opts.color);
      const strokeWidth = (opts.strokeWidth === undefined ? 3 : opts.strokeWidth);
      let coordSpaceEndpoints;
      if ((p2.x < p1.x) &&
          (p2.y < p1.y)) {
        coordSpaceEndpoints = { 
          p1: {
            x: bbox.p2.x, y: bbox.p2.y
          },
          p2: {
            x: bbox.p1.x, y: bbox.p1.y
          }
        };
      } else if (p2.x < p1.x) {
        coordSpaceEndpoints = { 
          p1: {
            x: bbox.p2.x, y: bbox.p1.y
          },
          p2: {
            x: bbox.p1.x, y: bbox.p2.y
          }
        };
      } else if (p2.y < p1.y) {
        coordSpaceEndpoints = { 
          p1: {
            x: bbox.p1.x, y: bbox.p2.y
          },
          p2: {
            x: bbox.p2.x, y: bbox.p1.y
          }
        };
      } else {
        coordSpaceEndpoints = { 
          p1: {
            x: bbox.p1.x, y: bbox.p1.y
          },
          p2: {
            x: bbox.p2.x, y: bbox.p2.y
          }
        };
      }

      // Finally, translate coords into viewport space.
      const finalCoordSpaceEndpoints = {
        p1: {
          x: coordSpaceEndpoints.p1.x - bbox.p1.x, y: coordSpaceEndpoints.p1.y - bbox.p1.y
        },
        p2: {
          x: coordSpaceEndpoints.p2.x - bbox.p1.x, y: coordSpaceEndpoints.p2.y - bbox.p1.y
        }
      }
      const pathPart = 'M ' + finalCoordSpaceEndpoints.p1.x + ' ' + finalCoordSpaceEndpoints.p1.y + ' ' +
                       'L ' + finalCoordSpaceEndpoints.p2.x + ' ' + finalCoordSpaceEndpoints.p2.y;
      let pathObj = 
          {
          'vector-effect': 'non-scaling-stroke',
          'stroke-width' : strokeWidth,
          stroke: color,
          fill: color,
          d: pathPart
        };
      if (opts.usesArrow !== undefined) {
        pathObj['marker-end'] =  'url(#arrowHead)';
      }
      if ((opts.dashed !== undefined) && (opts.dashed === 'dashed')) {
        if (opts.dashWidth) {
          pathObj['stroke-dasharray'] = opts.dashWidth;
        } else {
          pathObj['stroke-dasharray'] = 4;
        }
      }
      const line = sticker.makeSvgElement('path', pathObj);

      const viewBox = [0,0,Math.max(10,Math.abs(bbox.p2.x-bbox.p1.x)),Math.max(10, Math.abs(bbox.p2.y-bbox.p1.y))];
      const renderedSvg = sticker.renderSvg([
        {
          el: line,
          x: bbox.p1.x + opts.lineStartOffset.x,
          y: bbox.p1.y + opts.lineStartOffset.y,
          width: viewBox[2],
          height: viewBox[3],
          color: color,
          viewBox: viewBox.join(' '),
          usesArrow: opts.usesArrow,
          arrowHeadSize: opts.arrowHeadSize
        }
      ]);

//      console.log('bbox:', bbox, 'finalCoordSpaceEndpoints', finalCoordSpaceEndpoints, 'viewBox', viewBox, 'pathPart:', pathPart);
      return renderedSvg;
    },


    makeEllipse: (opts) => {
    },

    // need to use html injection, not code generation to make stuff work,
    // cf my post: https://stackoverflow.com/questions/52675823/preserveaspectratio-ignored-by-code-generation-but-not-html-injection-for-svg-p

    makeRightCurlyBracePath: () => {
      const rightCurlyBracePath =
        sticker.makeSvgElement('path',
                           {
                             fill: '#000',
                             stroke: "#000",
                             "vector-effect": "non-scaling-stroke",
                             "stroke-width" : "3",
                             d: "M0,0 A100, 173.20508075688772 0 0 1  100, 173.20508075688772 A100, " +
                                "173.20508075688772 0 0 0 200 346.41016151377545 A100, " +
                                "173.20508075688772 0 0 0 100, 519.6152422706632 A100, " +
                                "173.20508075688772 0 0 1 0, 692.8203230275509"
                           }
        );
      return rightCurlyBracePath;
    },

    makeLeftCurlyBrace: (x, y, height) => {
      const curlyViewBox = '0 0 200 692';
      const rightCurlyBracePath = sticker.makeRightCurlyBracePath();
      const renderedSvg = sticker.renderSvg([
        {
          el: rightCurlyBracePath,
          width: 8,
          height: height,
          viewBox: curlyViewBox,
          x: x,
          y : y,
          cssTransform: "scaleX(-1)" // css transform
        }
      ]);
      return renderedSvg;
    },

    makeRightCurlyBrace: (x, y, height) => {
      const curlyViewBox = '0 0 200 692';
      const rightCurlyBracePath = sticker.makeRightCurlyBracePath();
      const renderedSvg = sticker.renderSvg([
        {
          el: rightCurlyBracePath,
          width: 8,
          height: height,
          viewBox: curlyViewBox,
          x: x,
          y : y
        }
      ]);
      return renderedSvg;
    },

    makeSymmetricCurlyBraces: (x, y, width, height) => {
      const curlyViewBox = '0 0 200 692';
      const curlyBracePath1 = sticker.makeRightCurlyBracePath();
      const curlyBracePath2 = sticker.makeRightCurlyBracePath();
      const renderedSvg = sticker.renderSvg([
        {
          el: curlyBracePath1,
          width: 8,
          height: height,
          viewBox: curlyViewBox,
          x: 0,
          y : 0,
          cssTransform: "scaleX(-1)" // css transform
        },
        {
          el: curlyBracePath2,
          width: 8,
          height: height,
          viewBox: curlyViewBox,
          x: width - 10,
          y : 0
        }
      ]);
      //console.log(renderedSvg);
      return renderedSvg;
    },

    makeSimplePath: (opts) => {
      const viewBox = opts.viewBox;
      const color = (opts.color === undefined ? '#000' : opts.color);
      const strokeWidth = (opts.strokeWidth === undefined ? 3 : opts.strokeWidth);
      let pathObj, thePath;
      let cssTransform = undefined;
      if (opts.cssTransform !== undefined) {
        cssTransform = opts.cssTransform;
      }
      let renderParms = [];
      for (let dRec of opts.d) {
        pathObj = 
          {
            'vector-effect': 'non-scaling-stroke',
            'stroke-width' : strokeWidth,
            stroke: color,
            d: dRec,
          };

        if (opts.fill !== undefined) {
          pathObj.fill = opts.fill;
        } else {
          pathObj['fill-opacity'] = 0;
        }

        if ((opts.dashed !== undefined) && (opts.dashed === 'dashed')) {
          if (opts.dashWidth) {
            pathObj['stroke-dasharray'] = opts.dashWidth;
          } else {
            pathObj['stroke-dasharray'] = 4;
          }
        }

        thePath = sticker.makeSvgElement('path',pathObj);
        renderParms.push({
          el: thePath,
          x: opts.dimensions.x,
          y : opts.dimensions.y,
          width: opts.dimensions.width,
          height: opts.dimensions.height,
          viewBox: opts.viewBox,
          cssTransform: cssTransform
        });
      }
      const renderedSvg = sticker.renderSvg(renderParms);
      return renderedSvg;
    },

    makeTopBracket: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          viewBox: '0 0 10 10',
          d: ["M 0 10 L 0 0 L 10 0 L 10 10"]
        })
      );
    },

    makeBottomBracket: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          viewBox: '0 0 10 10',
          d: ["M 0 0 L 0 10 L 10 10 L 10 0"]
        })
      );
    },

    makeLeftBracket: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          viewBox: '0 0 10 10',
          d: ["M 10 10 L 0 10 L 0 0 L 10 0"]
        })
      );
    },

    makeRightBracket: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          viewBox: '0 0 10 10',
          d: ["M 0 0 L 10 0 L 10 10 L 0 10"]
        })
      );
    },

    makeHorizontalBrackets: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          viewBox: '0 0 10 10',
          d: ["M 0 1 L 0 0 L 10 0 L 10 1",
              "M 0 9 L 0 10 L 10 10 L 10 9"]
        })
      );
    },

    makeVerticalBrackets: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          viewBox: '0 0 10 10',
          d: ["M 1 0 L 0 0 L 0 10 L 1 10",
              "M 9 0 L 10 0 L 10 10 L 9 10"]
        })
      );
    },

    makeRectangle: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          viewBox: '0 0 100 100',
          d: ["M 0 0 L 0 100 L 100 100 L 100 0 Z"]
        })
      );
    },

    makeRightTriangle: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          viewBox: '0 0 100 125',
          d: ["M 0 125 L 100 125 L 0 0 Z"]
        })
      );
    },

    makeIsocelesTriangle: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          viewBox: '0 0 100 125',
          d: ["M 0 125 L 100 125 L 50 0 Z"],
        })
      );
    },

    makeTheta: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          viewBox: '0 0 469 843.75',
          d: ["M469 334c-2,440 -453,468 -469,2 -13,-435 472,-460 469,-2zm-383 -20l298 0c-9,-366 -288,-376 -298,-6l0 6zm297 46l-297 0c16,345 279,397 297,11 0,-4 0,-7 0,-11z"],
          fill: opts.color
        })
      );
    },

    makeSigma: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: 2,
          viewBox: '0 0 16 16',
          d: ['M2,1l5.46,7.27L2,15h12v-4h-1v1c0,0.552-0.448,1-1,1H4.97l4.39-5.52L5.25,2H12c0.552,0,1,0.448,1,1v1h1V1H2z'],
          fill: opts.color
        })
      );
    },

    makeSmiley: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: 2,
          viewBox: '0 0 50 50',
          d: ['M25,1A24,24,0,1,0,49,25,24,24,0,0,0,25,1Zm0,46A22,22,0,1,1,47,25,22,22,0,0,1,25,47ZM35.77,33.32a1,1,0,0,1-.13,1.41C31.73,38,28.06,39.1,24.9,39.1a16,16,0,0,1-10.63-4.45,1,1,0,0,1,1.45-1.38c0.34,0.35,8.35,8.52,18.63-.08A1,1,0,0,1,35.77,33.32ZM15,19a3,3,0,1,1,3,3A3,3,0,0,1,15,19Zm14,0a3,3,0,1,1,3,3A3,3,0,0,1,29,19Z'],
        })
      );
    },

    makeFrowney: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: 2,
          viewBox: '0 0 100 125',
          d: ['M50,2.5C23.809,2.5,2.5,23.809,2.5,50S23.809,97.5,50,97.5S97.5,76.191,97.5,50S76.191,2.5,50,2.5z M50,91.684    C27.016,91.684,8.316,72.984,8.316,50S27.016,8.316,50,8.316S91.684,27.016,91.684,50S72.984,91.684,50,91.684z M37.489,41.386    c2.964,0,5.369-2.403,5.369-5.369c0-2.966-2.405-5.368-5.369-5.368c-2.966,0-5.369,2.402-5.369,5.368    C32.12,38.982,34.523,41.386,37.489,41.386z M62.511,41.386c2.965,0,5.369-2.403,5.369-5.369c0-2.966-2.404-5.368-5.369-5.368    c-2.966,0-5.368,2.402-5.368,5.368C57.143,38.982,59.545,41.386,62.511,41.386z M50.001,51.186    c-13.939,0-20.525,9.548-22.06,14.597c-0.467,1.537,0.399,3.161,1.936,3.628c1.539,0.471,3.161-0.399,3.628-1.936    c0.032-0.105,3.336-10.473,16.496-10.473c13.015,0,16.363,10.061,16.494,10.472c0.381,1.255,1.534,2.063,2.781,2.063    c0.28,0,0.564-0.04,0.846-0.127c1.538-0.467,2.405-2.091,1.938-3.627C70.524,60.733,63.939,51.186,50.001,51.186z'],
        })
      );
    },

    makeThumbsUp: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: 2,
          viewBox: '0 0 218 346.25',
          d: ['M28 263l31 -9c64,42 77,13 92,10 4,0 1,4 17,0 22,-7 31,-19 23,-35 19,-6 21,-18 15,-33 15,-9 15,-26 3,-38 19,-37 -11,-67 -80,-48 -5,-36 11,-59 5,-80 -7,-27 -25,-31 -50,-30 3,68 8,35 -25,101 -27,55 -3,48 -57,63 -6,36 4,70 26,99zm4 -12c-16,-24 -23,-49 -21,-77 48,-14 33,-15 57,-65 33,-71 31,-34 27,-97 31,1 32,26 26,50 -7,27 -6,40 -1,62 26,-7 74,-21 82,6 7,27 -22,40 -35,41l-42 -7c9,-28 36,-19 44,-19l10 -3 7 -13c-29,8 -10,3 -31,4 -24,1 -40,15 -43,40l8 1c-8,7 -13,16 -14,28l9 1c-5,6 -10,15 -12,26l14 3c-5,7 -9,15 -11,26l29 4c-29,10 -50,-1 -74,-20l-29 9zm87 -58c12,-30 27,-10 49,-12 5,0 27,-7 33,-14 24,20 -36,32 -39,33l-43 -7zm-2 27l10 -15c44,7 28,8 70,-4 10,19 -35,26 -35,26l-45 -7zm3 30l9 -17c36,5 26,7 53,0 4,16 -17,22 -23,22l-39 -5z'],
          fill: opts.color
        })
      );
    },

    makeThumbsDown: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: 2,
          viewBox: '0 0 226 357.5',
          d: ['M18 27l33 4c59,-51 77,-23 92,-23 5,0 0,-4 18,-2 23,3 33,15 28,32 20,4 24,15 20,32 17,7 19,23 8,37 25,36 -1,70 -74,60 0,38 19,59 16,82 -3,27 -21,34 -46,37 -6,-70 3,-37 -40,-99 -35,-52 -10,-48 -67,-56 -11,-36 -6,-71 12,-104zm6 12c-13,26 -16,53 -10,81 51,7 35,11 67,58 44,66 36,29 41,95 32,-7 29,-32 19,-55 -11,-27 -11,-40 -9,-63 27,4 78,10 82,-18 4,-28 -28,-37 -41,-36l-42 13c13,27 39,14 48,13l10 1 9 12c-30,-4 -10,-1 -33,1 -23,2 -41,-9 -49,-34l8 -3c-8,-6 -15,-14 -18,-26l9 -3c-6,-5 -11,-13 -16,-24l15 -5c-7,-6 -12,-15 -15,-25l28 -8c-30,-7 -50,8 -72,30l-31 -4zm96 46c17,28 30,7 52,5 6,-1 29,4 36,9 21,-23 -42,-27 -44,-27l-44 13zm-5 -27l12 14c44,-13 27,-12 72,-6 7,-21 -39,-22 -40,-22l-44 14zm-1 -31l11 16c36,-11 26,-11 54,-7 2,-18 -20,-20 -27,-20l-38 11z'],
          fill: opts.color
        })
      );
    },


    makeStar: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: 2,
          viewBox: '0 0 1024 1280',
          d: ['M521.19122173 257.59668148l48.67463902 112.36592198c10.61521383 24.46677333 33.65799506 41.42522469 60.32548344 44.14375505l123.62840495 12.55702124-92.30057877 79.48464988c-20.71261235 17.86462815-29.90383408 45.43829333-23.8195042 72.10578173l27.44421136 121.68659752-105.37541531-64.20909827c-11.52139061-6.99050667-24.85513482-10.74466765-38.31833283-10.74466765-13.59265185 0-26.79694222 3.75416098-38.31833286 10.74466765l-105.37541529 64.20909827 27.44421135-121.68659752c5.95487605-26.66748839-3.10689185-54.24115358-23.8195042-72.10578173l-92.30057876-79.48464988 123.62840494-12.55702124c26.53803457-2.71853037 49.71026963-19.5475279 60.32548346-44.14375505l48.1568237-112.36592198m0-117.80298272c-6.2137837 0-12.55702124 3.3657995-15.40500543 10.09739852l-85.43952593 197.28763258c-2.45962272 5.56651457-7.63777581 9.45012939-13.72210568 10.09739853l-216.446799 22.00715063c-14.7577363 1.55344592-20.45370469 19.80643555-9.32067556 29.51547258l163.11182222 140.45740248c4.66033778 4.01306864 6.86105283 10.35630617 5.43706074 16.44063605l-48.1568237 213.98717629c-2.58907653 11.26248297 6.34323753 20.58315852 16.44063604 20.58315852 2.84798419 0 5.95487605-0.77672297 8.67340642-2.45962272l186.15460346-113.40155259c2.71853037-1.68289975 5.69596839-2.45962272 8.80286024-2.45962272s6.08432987 0.77672297 8.80286026 2.45962272l186.15460344 113.40155259c2.84798419 1.68289975 5.82542222 2.45962272 8.67340644 2.45962272 10.09739852 0 19.02971259-9.32067555 16.44063604-20.58315852L693.23535803 565.69679013c-1.4239921-6.08432987 0.77672297-12.42756741 5.43706073-16.44063605l163.11182222-140.45740248c11.26248297-9.70903703 5.43706075-27.96202667-9.32067555-29.51547258l-216.44679901-22.00715063c-6.08432987-0.64726914-11.26248297-4.40143013-13.72210567-10.09739853l-85.43952593-197.28763258c-3.23634569-6.73159902-9.45012939-10.09739852-15.66391309-10.09739852z'],
          fill: opts.color
        })
      );
    },

    makeRibbon: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: 2,
          viewBox: '0 0 100 100',
          d: ["M76.979,12.22c-0.366-0.579-1.004-0.93-1.689-0.93H59.165c-0.768,0-1.468,0.439-1.802,1.132l-6.634,13.76l-7.117-13.808  c-0.343-0.666-1.028-1.084-1.777-1.084H24.71c-0.686,0-1.323,0.351-1.689,0.93c-0.367,0.579-0.411,1.306-0.118,1.926l15.213,32.151  c-6.585,4.021-10.99,11.274-10.99,19.538C27.125,78.448,37.387,88.71,50,88.71s22.875-10.262,22.875-22.875  c0-8.264-4.405-15.518-10.99-19.538l15.213-32.151C77.391,13.525,77.347,12.799,76.979,12.22z M27.869,15.29h12.747l14.572,28.271  C53.521,43.172,51.785,42.96,50,42.96c-2.927,0-5.724,0.559-8.299,1.564L27.869,15.29z M68.875,65.835  c0,10.407-8.468,18.875-18.875,18.875s-18.875-8.468-18.875-18.875S39.593,46.96,50,46.96S68.875,55.428,68.875,65.835z   M59.201,42.617l-6.178-11.984l7.397-15.343h11.71L59.201,42.617z M48.207,53.277l-2.999,6.074l-6.703,0.973  c-0.754,0.109-1.38,0.638-1.615,1.361s-0.039,1.519,0.506,2.051l4.852,4.728l-1.146,6.677c-0.128,0.75,0.181,1.509,0.796,1.956  c0.349,0.253,0.762,0.382,1.176,0.382c0.318,0,0.638-0.076,0.931-0.229L50,74.098l5.994,3.151c0.675,0.353,1.491,0.295,2.106-0.152  s0.924-1.206,0.796-1.956l-1.145-6.677l4.852-4.728c0.545-0.532,0.741-1.327,0.506-2.051s-0.861-1.252-1.615-1.361l-6.703-0.973  l-2.997-6.074c-0.337-0.683-1.032-1.115-1.794-1.115C49.239,52.162,48.544,52.595,48.207,53.277z M51.669,62.064  c0.292,0.591,0.855,1,1.507,1.095l3.732,0.542l-2.7,2.632c-0.472,0.46-0.687,1.122-0.576,1.771l0.638,3.72l-3.339-1.756  c-0.582-0.307-1.279-0.307-1.861,0l-3.34,1.756l0.638-3.72c0.11-0.648-0.104-1.311-0.575-1.771l-2.701-2.632l3.732-0.542  c0.651-0.095,1.215-0.504,1.506-1.095L50,58.682L51.669,62.064z"],
          fill: opts.color
        })
      );
    },
    
    makeAxis: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: opts.strokeWidth,
          viewBox: '0 0 100 100',
          d:["M89.7,85.7c0,0.2-0.1,0.3-0.2,0.4l-3.2,2.2c-0.1,0.1-0.2,0.1-0.3,0.1c-0.1,0-0.2,0-0.2-0.1c-0.2-0.1-0.3-0.3-0.3-0.4v-1.2  H13c-0.6,0-1-0.4-1-1V15.8h-1.2c-0.2,0-0.4-0.1-0.4-0.3c-0.1-0.2-0.1-0.4,0-0.5l2.2-3.2c0.2-0.3,0.6-0.3,0.8,0l2.2,3.2  c0.1,0.2,0.1,0.4,0,0.5c-0.1,0.2-0.3,0.3-0.4,0.3H14v68.9h71.4v-1.2c0-0.2,0.1-0.4,0.3-0.4c0.2-0.1,0.4-0.1,0.5,0l3.2,2.2  C89.6,85.4,89.7,85.6,89.7,85.7z"],
          fill: 'solid',
        })
      );
    },

    makeBomb: (opts) => {
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: opts.strokeWidth,
          viewBox: '0 0 100 100',
          d:["M44.5,44.4v-3.9c0-1.1-0.9-2-2-2h-5.6c0-2.2,0.3-5.1,1.8-6.9c1.1-1.3,2.6-1.9,4.7-1.9c3.1,0,6.1,1.2,8.9,2.3  c5.4,2.2,11.1,4.4,16.9-1.6c0.6-0.6,0.6-1.5,0-2.1c-0.6-0.6-1.5-0.6-2.1,0c-4.4,4.6-8.5,3-13.6,0.9c-3.1-1.3-6.4-2.6-10-2.6  c-3,0-5.3,1-7,3c-2.2,2.6-2.5,6.3-2.5,8.8h-5.1c-1.1,0-2,0.9-2,2v3.9C18.3,47.9,12.3,56.3,12.3,66c0,12.9,10.4,23.3,23.3,23.3  S59,78.9,59,66C59,56.3,53,47.9,44.5,44.4z M32.9,80.3c-0.2,0.6-0.8,1.1-1.4,1.1c-0.1,0-0.3,0-0.4-0.1c-6.8-2-11.3-8.2-11.3-15.3  c0-3.5,1.1-6.9,3.3-9.7c0.5-0.7,1.4-0.8,2.1-0.3c0.7,0.5,0.8,1.4,0.3,2.1c-1.7,2.3-2.7,5-2.7,7.9c0,5.7,3.8,10.8,9.2,12.4  C32.7,78.6,33.2,79.5,32.9,80.3z",
             "M82.3,14.5c0.5-0.6,0.5-1.6-0.2-2.1c-0.6-0.5-1.6-0.5-2.1,0.2l-8.6,10.1c-0.5,0.6-0.5,1.6,0.2,2.1c0.3,0.2,0.6,0.4,1,0.4  c0.4,0,0.8-0.2,1.1-0.5L82.3,14.5z",
             "M60.7,13.9C60.7,13.9,60.7,13.9,60.7,13.9l3.9,8.7c0,0,0,0,0,0l0.5,1.1c0.3,0.6,0.8,0.9,1.4,0.9c0.2,0,0.4,0,0.6-0.1  c0.8-0.3,1.1-1.2,0.7-2l-0.5-1.1c0,0,0,0,0,0l-3.9-8.7c0,0,0,0,0,0l-0.5-1.1c-0.3-0.8-1.2-1.1-2-0.7c-0.8,0.3-1.1,1.2-0.7,2  L60.7,13.9z",
             "M75.5,32.4c-0.6-0.6-1.6-0.5-2.1,0.1c-0.6,0.6-0.5,1.6,0.1,2.1l9.7,9.2c0.3,0.3,0.7,0.4,1,0.4c0.4,0,0.8-0.2,1.1-0.5  c0.6-0.6,0.5-1.6-0.1-2.1L75.5,32.4z",
             "M86.2,26.6l-10.5,0c-0.8,0-1.5,0.7-1.5,1.5c0,0.8,0.7,1.5,1.5,1.5l10.5,0c0.8,0,1.5-0.7,1.5-1.5  C87.7,27.3,87,26.6,86.2,26.6z",
             "M50.9,21.7l11.6,5.4c0.2,0.1,0.4,0.1,0.6,0.1c0.6,0,1.1-0.3,1.4-0.9c0.4-0.8,0-1.6-0.7-2L52.2,19c-0.7-0.4-1.6,0-2,0.7  C49.9,20.5,50.2,21.3,50.9,21.7z",
             "M69.5,34.8c-0.8,0-1.5,0.7-1.5,1.5l0,11.3c0,0.8,0.7,1.5,1.5,1.5c0.8,0,1.5-0.7,1.5-1.5l0-11.3C71,35.4,70.4,34.8,69.5,34.8  z"
          ],
          fill: opts.color
        })
      );
    },
    
    makeCheckmark: (opts) => {
      let dimensions;
      if (opts.iconUsage) {
        dimensions = $.extend({}, opts.dimensions);
      } else {
        dimensions = { x: opts.dimensions.x, 
                       y: opts.dimensions.y,
                       width:  Math.max(opts.dimensions.width, 25)
        };
        dimensions.height = dimensions.width * 1.5;
      }
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: opts.strokeWidth,
          viewBox: '0 0 587 783.75',
          d:["M0 303c61,65 122,129 184,194 134,-166 227,-376 403,-497 -181,160 -285,402 -400,627 -62,-108 -125,-216 -187,-324z"],
          color:'#090',
          fill:'#4f4',
          dimensions:dimensions,
          dashed:undefined
        })
      );
    },

    makeXmark: (opts) => {
      let dimensions, strokeWidth;
      if (opts.iconUsage) {
        dimensions = $.extend({}, opts.dimensions);
        strokeWidth = opts.strokeWidth;
      } else {
        strokeWidth = 3;
        dimensions = { x: opts.dimensions.x, 
                       y: opts.dimensions.y,
                       width:  Math.max(opts.dimensions.width, 25)
        };
        dimensions.height = dimensions.width;
      }
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: strokeWidth,
          viewBox: '0 0 100 100',
          d:["M10 10 L 80 80 M 80 10 L 10 80"],
          color: 'red',
          dimensions: dimensions,
          dashed: undefined
        })
      );
    },

    makeGrid: (opts) => {
      let dimensions, strokeWidth;
      if (opts.iconUsage) {
        dimensions = $.extend({}, opts.dimensions);
        strokeWidth = opts.strokeWidth;
      } else {
        strokeWidth = 3;
        dimensions = { x: opts.dimensions.x, 
                       y: opts.dimensions.y,
                       width:  Math.max(opts.dimensions.width, 25)
        };
        dimensions.height = dimensions.width;
      }
      return sticker.makeSimplePath(
        $.extend(opts, {
          strokeWidth: strokeWidth,
          viewBox: '0 0 100 100',
          d:[
            "M 0  0  L 100  0 " +
            "M 0 25  L 100 25" +
            "M 0 50  L 100 50" + 
            "M 0 75  L 100 75" + 
            "M 0 100 L 100 100" +
            "M 0  0  L 0  100 " +
            "M 25 0  L 25 100" +
            "M 50 0  L 50 100" + 
            "M 75 0  L 75 100" + 
            "M 100 0 L 100 100"
          ],
          dimensions: dimensions,
          dashed: undefined
        })
      );
    },


  }

  return (sticker);

});