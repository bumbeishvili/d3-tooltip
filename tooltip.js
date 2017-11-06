/*  

This code is based on following convention:

https://github.com/bumbeishvili/d3-coding-conventions/blob/84b538fa99e43647d0d4717247d7b650cb9049eb/README.md


*/


d3.componentsTooltip = function d3ComponentsTooltip(params) {
  // exposed variables
  var attrs = {
    svgWidth: 400,
    svgHeight: 400,
    marginTop: 5,
    marginBottom: 5,
    marginRight: 5,
    marginLeft: 5,
    container: 'body',
    tooltipRowHeight: 25,
    minSpaceBetweenColumns: 50,
    fontSize: 13,
    arrowHeight: 10,
    arrowLength: 20,
    contentMargin: 0,
    heightOffset: 7,
    textColor: "#2C3E50",
    tooltipFill: "white",
    leftMargin: 10,
    rightMargin: 3,
    rows: [
      {
        left: "default id",
        right: "{id}"
      },
    ],
    x: null,
    y: null,
    direction: "bottom",
    data: null
  };

  /*############### IF EXISTS OVERWRITE ATTRIBUTES FROM PASSED PARAM  #######  */

  var attrKeys = Object.keys(attrs);
  attrKeys.forEach(function (key) {
    if (params && params[key]) {
      attrs[key] = params[key];
    }
  })

  //innerFunctions which will update visuals
  var updateData;
  var displayTooltip;
  var hideTooltip;

  //main chart object
  var main = function (selection) {
    selection.each(function scope() {

      //calculated properties
      var calc = {}
      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;
      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

      //drawing containers
      var container = d3.select(this);

      //add shadow svg
      var svg = d3.select('body').patternify({ tag: 'svg', selector: 'tooltip-shadow-wrapper-svg' })

      //add container g element
      var chart = svg.patternify({ tag: 'g', selector: 'chart' })
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');

      // Add filters ( Shadows)
      var defs = chart.patternify({ selector: 'defs-element', tag: 'defs' })
      attrs.dropShadowUrl = "drop-shadow–" + Math.floor(Math.random() * 1000000);

      //Drop shadow filter
      var dropShadowFilter = defs.patternify({ selector: 'filter-element', tag: 'filter' }).attr("id", attrs.dropShadowUrl).attr("height", "150%").attr('y', "-30%");
      dropShadowFilter.patternify({ selector: 'fe-gaussian-blur-element', tag: 'feGaussianBlur' }).attr("in", "SourceAlpha").attr("stdDeviation", 5).attr("result", "blur");
      dropShadowFilter.patternify({ selector: 'feOffset-element', tag: 'feOffset' }).attr("in", "blur").attr("dx", 2).attr("dy", 5).attr("result", "offsetBlur");
      dropShadowFilter.patternify({ selector: 'feFlood-element', tag: 'feFlood' }).attr('flood-color', 'black').attr("flood-opacity", "0.4").attr("result", "offsetColor");
      dropShadowFilter.patternify({ selector: 'feComposite-element', tag: 'feComposite' }).attr('in', 'offsetColor').attr('in2', 'offsetBlur').attr("operator", "in").attr("result", "offsetBlur");
      var feMerge = dropShadowFilter.patternify({ selector: 'feMerge-element', tag: 'feMerge' })
      feMerge.patternify({ selector: 'feMergeNode-element', tag: 'feMergeNode' }).attr("in", "offsetBlur")
      feMerge.patternify({ selector: 'feMergeNode2-element', tag: 'feMergeNode' }).attr("in", "SourceGraphic");


      hideTooltip = function (){
        attrs.container.selectAll(".tooltipContent").remove();
      }
      displayTooltip = function () {
        var params = attrs;
        var isDisplayed = true;
        var x = attrs.x;
        var y = attrs.y;
        var hoveredElement = { value: "test1", totalValue: "test2", id: "test3" };
        var filterUrl = attrs.dropShadowUrl;
        var direction = attrs.direction;



        //check container type first and transform if necessary
        if (!(attrs.container instanceof d3.selection)) {
          attrs.container = d3.select(attrs.container);
        }


        attrs.container.selectAll(".tooltipContent").remove();

        if (!isDisplayed) {
          return;
        }

        var tooltipContentWrapper = attrs.container
          .append("g")
          .attr("class", "tooltipContent")
          .attr("pointer-events", "none");

        var tooltipWrapper = tooltipContentWrapper
          .append("g")
          .style("pointer-events", "none");

        tooltipWrapper.append("path");

        var g = tooltipWrapper.append("g");

        var rows = g
          .selectAll(".rows")
          .data(attrs.rows)
          .enter()
          .append("g")
          .attr("font-size", attrs.fontSize)
          .attr("dominant-baseline", "middle")
          .attr("fill", attrs.textColor)
          .attr(
          "transform",
          (d, i) =>
            `translate(${attrs.contentMargin},${i *
            attrs.tooltipRowHeight +
            attrs.heightOffset +
            attrs.contentMargin})`
          );

        rows
          .append("text")
          .attr("class", "left")
          .attr("y", attrs.tooltipRowHeight / 3)
          .attr("x", attrs.leftMargin)
          .text(d => replaceWithProps(d.left, hoveredElement))
          .attr("text-anchor", "start");
        rows
          .append("text")
          .attr("class", "right")
          .attr("y", attrs.tooltipRowHeight / 3)
          .attr("x", attrs.rightMargin)
          .text(d => replaceWithProps(d.right, hoveredElement))
          .attr("text-anchor", "end");

        var maxWidth = 0;
        rows.each(function (g) {
          var row = d3.select(this);
          var currentWidth =
            row.select(".left").node().getBoundingClientRect().width +
            row.select(".right").node().getBoundingClientRect().width +
            attrs.minSpaceBetweenColumns;

          if (currentWidth > maxWidth) {
            maxWidth = currentWidth;
          }
        });

        rows.select(".right").attr("x", maxWidth);

        maxWidth += attrs.leftMargin + attrs.rightMargin;

        var height =
          attrs.tooltipRowHeight * attrs.rows.length +
          attrs.contentMargin * 2 -
          attrs.heightOffset +
          attrs.tooltipRowHeight / 3;
        var halfArrowLength = attrs.arrowLength / 2;
        var halfWidth = maxWidth / 2;
        var fullWidth = maxWidth;
        var halfHeight = height / 2;

        var strPath = `M 0 0 

                ${direction != "left"
            ? ""
            : `  L 0 ${halfHeight - halfArrowLength}
                       L   ${-attrs.arrowHeight} ${halfHeight}
                       L 0 ${halfHeight + halfArrowLength}  `}

                L 0  ${height} 
                
                ${direction != "bottom"
            ? ""
            : ` L ${halfWidth - halfArrowLength}  ${height} 
                                        L ${halfWidth} ${height +
            attrs.arrowHeight} 
                                        L ${halfWidth +
            halfArrowLength} ${height}`}
               
                L ${fullWidth} ${height}  

               ${direction != "right"
            ? ""
            : ` L ${fullWidth} ${halfHeight - halfArrowLength}
                                    L  ${fullWidth +
            attrs.arrowHeight} ${halfHeight}
                                    L ${fullWidth} ${halfHeight +
            halfArrowLength}  `}

                
                L ${fullWidth} 0 
                
                ${direction != "top"
            ? ""
            : `L ${halfWidth + halfArrowLength} 0  
                                      L ${halfWidth} ${-attrs.arrowHeight} 
                                      L ${halfWidth - halfArrowLength}  0 
                                     `}

                 L 0 0 `;

        var tooltipTranslateConfig = {
          left: {
            x: halfWidth + attrs.arrowHeight,
            y: halfHeight + attrs.arrowHeight
          },
          bottom: {
            x: 0,
            y: 0
          },
          right: {
            x: -(halfWidth + attrs.arrowHeight),
            y: halfHeight + attrs.arrowHeight
          },
          top: {
            x: 0,
            y: height + 2 * attrs.arrowHeight
          }
        };

        // if(y < 0)
        // {
        tooltipContentWrapper.attr(
          "transform",
          `translate(${+x + +tooltipTranslateConfig[direction].x},${y +
          tooltipTranslateConfig[direction].y})`
        );
        // }

        tooltipWrapper
          .select("path")
          .attr(
          "d",
          `M 0 0  
                L 0 100 
                L 121 99 
                L 143 132 
                L 165 99 
                L 300 100 
                L 300 0 
                L 0 0 `
          )
          .attr("d", strPath)
          .attr("fill", attrs.tooltipFill)
          .attr("filter", `url(#${filterUrl})`);

        //wrapper polyline

        tooltipWrapper

          .append("polyline") // attach a polyline
          .style('display', 'none')
          .style("stroke", "black") // colour the line
          .style("fill", "none") // remove any fill colour
          .attr(
          "points",
          `

                ${direction != "left"
            ? ""
            : `  0 ${halfHeight - halfArrowLength}
                       ${-attrs.arrowHeight} ${halfHeight}
                        0 ${halfHeight + halfArrowLength}  `}

                

                     0,${height}, 
                             ${direction != "bottom"
            ? ""
            : `  ${halfWidth - halfArrowLength}  ${height} 
                                                     ${halfWidth} ${height +
            attrs.arrowHeight} 
                                                   ${halfWidth +
            halfArrowLength} ${height}`}
                     

                     ${fullWidth}, ${height}
${fullWidth}, ${0}
${0}, ${0}
0,${height}

`
          ); // x,y points
        // .attr("points", "100,50, 200,150, 300,50");  // x,y points
        /*
          rows
            .append("rect")
            .attr("width", fullWidth)
            .attr("height", 1)
            .attr("x", -attrs.contentMargin)
            .attr("y", -attrs.heightOffset);
            */

        /*
      
      
        tooltipWrapper
          .append("rect")
          .attr("width", 1)
          .attr("height", height)
          .attr("x", fullWidth);
        tooltipWrapper
          .append("rect")
          .attr("width", 1)
          .attr("height", height)
          .attr("x", 0);
          
          */

        tooltipWrapper.attr(
          "transform",
          `translate(${-halfWidth},${-height - attrs.arrowHeight})`
        );
      }

      function replaceWithProps(text, obj) {
        var keys = Object.keys(obj);
        keys.forEach(key => {
          var stringToReplace = `{${key}}`;
          var re = new RegExp(stringToReplace, "g");
          text = text.replace(re, obj[key]);
        });
        return text;
      }

      // smoothly handle data updating
      updateData = function () {

      }
      //#########################################  UTIL FUNCS ##################################

      function debug() {
        if (attrs.isDebug) {
          //stringify func
          var stringified = scope + "";

          // parse variable names
          var groupVariables = stringified
            //match var x-xx= {};
            .match(/var\s+([\w])+\s*=\s*{\s*}/gi)
            //match xxx
            .map(d => d.match(/\s+\w*/gi).filter(s => s.trim()))
            //get xxx
            .map(v => v[0].trim())

          //assign local variables to the scope
          groupVariables.forEach(v => {
            main['P_' + v] = eval(v)
          })
        }
      }
      debug();
    });
  };

  //----------- PROTOTYEPE FUNCTIONS  ----------------------
  d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // pattern in action
    var selection = container.selectAll('.' + selector).data(data)
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection)
    selection.attr('class', selector);
    return selection;
  }

  //dinamic keys functions
  Object.keys(attrs).forEach(key => {
    // Attach variables to main function
    return main[key] = function (_) {
      var string = `attrs['${key}'] = _`;
      if (!arguments.length) { return eval(` attrs['${key}'];`); }
      eval(string);
      return main;
    };
  });

  //set attrs as property
  main.attrs = attrs;

  //debugging visuals
  main.debug = function (isDebug) {
    attrs.isDebug = isDebug;
    if (isDebug) {
      if (!window.charts) window.charts = [];
      window.charts.push(main);
    }
    return main;
  }

  //exposed update functions
  main.data = function (value) {
    if (!arguments.length) return attrs.data;
    attrs.data = value;
    if (typeof updateData === 'function') {
      updateData();
    }
    return main;
  }

  main.show = function (data) {
    attrs.data = data;
    displayTooltip();
  }

  main.hide = function () {
    hideTooltip();
  }
  // run  visual
  main.run = function () {
    d3.selectAll(attrs.container).call(main);
    return main;
  }

  return main.run();
}
