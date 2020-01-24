import * as d3 from 'd3';

function bubbleChart() {

  // Constants for sizing
  var width = 940;
  var height = 600;
  var center = { x: width / 3, y: height / 2 };
  var radius = 22;

  // @v4 strength to apply to the position forces
  var forceStrength = 0.5;

  // These will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];

  // Charge function that is called for each node.
  // As part of the ManyBody force.
  // This is what creates the repulsion between nodes.
  //
  // Charge is proportional to the diameter of the
  // circle (which is stored in the radius attribute
  // of the circle's associated data.
  //
  // This is done to allow for accurate collision
  // detection with nodes of different sizes.
  //
  // Charge is negative because we want nodes to repel.
  // @v4 Before the charge was a stand-alone attribute
  //  of the force layout. Now we can use it as a separate force!
  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  // Here we create a force layout and
  // @v4 We create a force simulation now and
  //  add forces to it.
  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  // @v4 Force starts up automatically,
  //  which we don't want as there aren't any nodes yet.
  simulation.stop();

  // Nice looking colors - no reason to buck the trend
  // @v4 scales now have a flattened naming scheme
  var fillColor = d3.scaleOrdinal()
    .domain(['groei', 'onderneming', 'voeding', 'financieel'])
    .range(['#ffca3a', '#3ddc97', '#8ac926', '#ff4f78']);
  /*
   * This data manipulation function takes the raw data from
   * the CSV file and converts it into an array of node objects.
   * Each node will store data and visualization values to visualize
   * a bubble.
   *
   * rawData is expected to be an array of data objects, read in from
   * one of d3's loading functions like d3.csv.
   *
   * This function returns the new node array, with a node in that
   * array for each element in the rawData input.
   */
  function createNodes(rawData) {
    var myNodes = rawData.map((d) => {
      return {
        id: d.id,
        radius: radius,
        name: d.name,
        theme: d.theme,
        tag: d.tag,
        x: Math.random() * width,
        y: Math.random() * height
      };
    });

    return myNodes;
  }

  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart(selector, rawData) {
    // convert raw data into nodes data
    nodes = createNodes(rawData);

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // var node = svg.selectAll('.node')
    //   .data(pack.nodes(flatten(json))
    //     .filter(function (d) { return !d.children; }))
    //   .enter().append('g')
    //   .attr('class', 'node')
    //   .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });

    // node.append('circle')
    //   .attr('r', function (d) { return d.r; });

    // node.append('text')
    //   .text(function (d) { return d.name; })
    //   .style('font-size', function (d) { return Math.min(2 * d.r, (2 * d.r - 8) / this.getComputedTextLength() * 24) + 'px'; })
    //   .attr('dy', '.35em');

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.name; });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    // @v4 Selections are immutable, so lets capture the
    //  enter selection to apply our transtition to below.
    var bubblesE = bubbles.enter().append('g')
      .classed('bubble', true);

    bubblesE.append('circle')
      .attr('r', 10)
      .attr('fill', function (d) { return fillColor(d.theme); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.theme)).darker(); })
      .attr('stroke-width', 2);

    bubblesE.append('text')
      .text(function (d) { return d.name; })
      .style('font-size', function (d) { return Math.min(2 * d.radius, (2 * d.radius - 8) / this.getComputedTextLength() * 24) + 'px'; })
      .attr('dy', '.35em')
      .attr('fill-opacity', 0);

    // @v4 Merge the original empty selection and the enter selection
    bubbles = bubbles.merge(bubblesE);

    // Fancy transition to make bubbles appear, ending with the correct radius
    bubbles.select('circle')
      .transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

    // Fancy transition to make text appear
    bubbles.select('text')
      .transition()
      .duration(2000)
      .attr('fill-opacity', 1);

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!
    simulation.nodes(nodes);

    // Set initial layout to single group.
    groupBubbles();
  };

  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
  function ticked() {
    bubbles
      .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
  }


  /*
   * Sets visualization in 'single group mode'.
   * The year labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
  function groupBubbles() {
    // @v4 Reset the 'x' force to draw the bubbles to the center.
    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }

  // return the chart function from closure.
  return chart;

}

var myBubbleChart = bubbleChart();

// Load the data
// d3.json('./data/data.json', display);
(async () => {
  try {
    var res = await fetch('./data/data.json')
    var data = await res.json();

    myBubbleChart('body', data);
  } catch (err) {
    console.error(err);
  }
})();
