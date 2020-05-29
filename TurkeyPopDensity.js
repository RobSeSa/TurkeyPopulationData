/*eslint-env es6*/
/*eslint-env browser*/
/*eslint no-console: 0*/
/*global d3 */

/*
  Robert Sato
  CSE 163
  May 28, 2020
*/

//Width and height
var w = 800;
var h = 500;

function normalize(x) {
  return (Math.sqrt(x)/10);
}

// create SVG element
var svg = d3.select("body")
   .append("svg")
   .attr("width", w)
   .attr("height", h);

var counter = 0;
// read csv data
d3.csv("TurkeyData.csv").then(function(data) {
  
  console.log(counter, "population density csv file: data =", data)
  counter += 1
  // create color buckets to scale data into
  var color = d3.scaleQuantize()
    .domain([
      d3.min(data, function(d) { return normalize(parseFloat(d.density)); }), 
      d3.max(data, function(d) { return normalize(parseFloat(d.density)); })])
    .range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);
  
  // load in GeoJSON data for Turkey provinces (Level 1)
  d3.json("TurkeyData.json").then(function(json) {
    
    var features = json.features;
    console.log("Features:", features);

    // code for unwrapping coordinates from
    // https://stackoverflow.com/questions/54947126/geojson-map-with-d3-only-rendering-a-single-path-in-a-feature-collection
    console.log("Unwrapping features...")
    features.forEach(function(feature) {
     if(feature.geometry.type == "MultiPolygon") {
      console.log("Multi:", feature.properties.NAME_1)
       feature.geometry.coordinates.forEach(function(polygon) {

         polygon.forEach(function(ring) {
           ring.reverse();
         })
       })
     }
     else if (feature.geometry.type == "Polygon") {
      console.log("Poly:", feature.properties.NAME_1)
       feature.geometry.coordinates.forEach(function(ring) {
         ring.reverse();
       })  
     }
   })

    console.log("Features after unwrapping:", features);

    // define map projection
    var projection = d3.geoAlbers()
    projection.rotate(-90).fitExtent([[0,0], [w, h]], json)

    // define a path generator
    var path = d3.geoPath()
      .projection(projection);

    
    // merge the density data and GeoJSON
    console.log("Looping over density data and merging with GeoJSON...")
    console.log("data.length =", data.length)
    
    for (var i = 0; i < data.length; i++) {
      // set province name from csv data
      var csvProvince = data[i].province;
      // set density vale from csv data
      var csvDensity = parseFloat(data[i].density);
      console.log("**Checking csvProvince =", csvProvince, " with csvDensity = ", csvDensity);
      
      // loop through all data in GeoJSON
      for (var j = 0; j < json.features.length; j++) {
        var jsonProvince = json.features[j].properties.NAME_1;
        // console.log("Comparing csvProvince = ", csvProvince, "with jsonProvince = ", jsonProvince);
        // match with the corresponding state inside the GeoJSON
        if (csvProvince == jsonProvince) {
          console.log("found match at", csvProvince)
          json.features[j].properties.value = csvDensity;
          break;
        }
      }
      
    }

    // bind data and create one path per GeoJSON feature!
    svg.selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("fill", function(d) {
        // get previously added density value from GeoJSON
        var value = d.properties.value;
        if (value) {
          // if the value exists, set the color
          console.log(d.properties.NAME_1, "has color(normalize(value)) =", color(normalize(value)), "for", normalize(value))
          return color(normalize(value));
        }
        else {
          console.log("path: DNE for", d.properties.NAME_1)
          return "#ccc";
        }
    });
    
    // create legend
    var legendX = w - 200
    var legendY = h - 160
    var legendYP = legendY + 8
    var legendW = w / 3
    var legendH = h / 3
    var boxdim = 15
    var spacing = boxdim * 2
    svg.append("rect")
      .attr("width", legendW)
      .attr("height", legendH)
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("fill", "grey");
    svg.append("rect")
      .attr("width", boxdim)
      .attr("height", boxdim)
      .attr("x", legendX + (boxdim/2))
      .attr("y", legendYP)
      .attr("fill", "#ccc");
    svg.append("rect")
      .attr("width", boxdim)
      .attr("height", boxdim)
      .attr("x", legendX + (boxdim/2))
      .attr("y", legendYP + spacing)
      .attr("fill", color(0));
    svg.append("rect")
      .attr("width", boxdim)
      .attr("height", boxdim)
      .attr("x", legendX + (boxdim/2))
      .attr("y", legendYP + (spacing * 2))
      .attr("fill", color(1));
    svg.append("rect")
      .attr("width", boxdim)
      .attr("height", boxdim)
      .attr("x", legendX + (boxdim/2))
      .attr("y", legendYP + (spacing * 3))
      .attr("fill", color(1.5));
    svg.append("rect")
      .attr("width", boxdim)
      .attr("height", boxdim)
      .attr("x", legendX + (boxdim/2))
      .attr("y", legendYP + (spacing * 4))
      .attr("fill", color(2));
    
    var textX = legendX + 40
    var textY = legendYP + 10
    svg.append("text")
      .attr("class", "label")
      .attr("x", textX)
      .attr("y", textY)
      .text("Data not found");
    svg.append("text")
      .attr("class", "label")
      .attr("x", textX)
      .attr("y", textY + spacing)
      .text("3 people/km^2");
    svg.append("text")
      .attr("class", "label")
      .attr("x", textX)
      .attr("y", textY + (spacing * 2))
      .text("30 people/km^2");
    svg.append("text")
      .attr("class", "label")
      .attr("x", textX)
      .attr("y", textY + (spacing * 3))
      .text("300 people/km^2");
    svg.append("text")
      .attr("class", "label")
      .attr("x", textX)
      .attr("y", textY + (spacing * 4))
      .text("3,000 people/km^2");
  });
  
});


