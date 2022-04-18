// set initial map
const map = L.map("map").setView([51.31939, 10.08933], 6);
const infoContainer = document.getElementById("info");

// you will need access to mapbox api to display the map
// const mapboxAccess =
//   "https://api.mapbox.com/styles/v1/maprookie/ckz7dk7us003q14qi1e522jlq/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWFwcm9va2llIiwiYSI6ImNrejdkaDhrMDEyNzkydnVzY280YW1tenIifQ.33Ao80pLJobpIjfStuAz5g";

if (typeof mapAccess !== "undefined") {
  L.tileLayer(mapboxAccess, {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
    minZoom: 6,
    maxZoom: 15,
    id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
  }).addTo(map);
} else {
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 6,
    maxZoom: 15,
  }).addTo(map);
}

// set maximum extent of map
const northeastCorner = L.latLng(56.96894, 20.63232);
const southwestCorner = L.latLng(43.97701, -0.46143);
const maxBounds = L.latLngBounds(northeastCorner, southwestCorner);
map.setMaxBounds(maxBounds);

// get cities information from geojson
getCitiesData();
async function getCitiesData() {
  const response = await fetch("./german_cities.geojson");
  const cities = await response.json();

  L.geoJSON(cities, {
    pointToLayer: styleCities,
    onEachFeature: onEachFeature,
  }).addTo(map);
}

// define different colors according to population size
function citiesColor(c) {
  return c > 1000000 ? "#AA2C49" : c > 500000 ? "#E3962B" : "#93C54B";
}

// define marker style
function styleCities(feature, latlng) {
  let cityStyle = {
    radius: 5,
    fillColor: citiesColor(feature.properties.einwohner),
    fillOpacity: 0.9,
    color: "#000",
    opacity: 1,
    weight: 1,
  };
  return L.circleMarker(latlng, cityStyle);
}

// hover in and out of city
function highlightCity(feature) {
  const layer = feature.target;
  layer.setStyle({
    weight: 2,
    radius: 10,
    fillOpacity: 1,
  });
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
  const popupStyle = {
    className: "popupStyle",
  };
  const cityName = layer.feature.properties.stadt;
  layer.bindPopup(cityName, popupStyle).addTo(map);
  layer.openPopup();
}

function resetHighlightCity(e) {
  const layer = e.target;
  layer.setStyle({
    weight: 1,
    radius: 5,
    fillOpacity: 0.9,
  });
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToBack();
  }
  layer.closePopup();
}

// show city information on click
function showCityDetails(e) {
  const layer = e.target;
  const city = e.target.feature.properties.stadt;
  const county = e.target.feature.properties.bundesland;
  const population = e.target.feature.properties.einwohner;
  const longitude = e.target.feature.geometry.coordinates[0];
  const latitude = e.target.feature.geometry.coordinates[1];
  const buttonColor = citiesColor(e.target.feature.properties.einwohner);
  map.removeLayer(layer);
  if (
    e.target.feature.properties.einwohner >= 100000 &&
    e.target.feature.properties.einwohner < 500000
  ) {
    map.flyTo([latitude, longitude], 13);
  } else if (
    e.target.feature.properties.einwohner >= 500000 &&
    e.target.feature.properties.einwohner < 1000000
  ) {
    map.flyTo([latitude, longitude], 12);
  } else {
    map.flyTo([latitude, longitude], 11);
  }
  infoContainer.classList.add("active");
  infoContainer.innerHTML = `
  <h2>${city}</h2>
  <p><strong>Bundesland:</strong> ${county}</p>
  <p><strong>Einwohner:</strong> ${population.toLocaleString("de-DE")}</p>
  <button class="info-button" style="background-color: ${buttonColor}">Zurück zur Übersicht</button>
  `;
  const infoButton = document.querySelector(".info-button");
  if (infoButton != null) {
    infoButton.addEventListener("click", () => {
      layer.addTo(map);
      layer.setStyle({
        weight: 1,
        radius: 5,
        fillOpacity: 0.9,
      });
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToBack();
      }
      map.setView([50.91939, 10.08933], 6);
      infoContainer.classList.remove("active");
    });
  }
}

function onEachFeature(feature, layer) {
  layer.on({
    click: showCityDetails,
    mouseover: highlightCity,
    mouseout: resetHighlightCity,
  });
}

// add legend
const legend = L.control({ position: "bottomright" });
legend.onAdd = function (map) {
  const div = L.DomUtil.create("div", "legend"),
    grades = [100000, 500000, 1000000],
    labels = [];

  div.innerHTML =
    '<div class="legend-heading"><strong>Stadtgrößen</strong></div>';
  grades.forEach((grade, index) => {
    div.innerHTML += `
    <div class="legend-item"><i style="background: ${citiesColor(
      grades[index] + 1
    )}" class="legend-item__color"></i>&nbsp;
    <span class="legend-item__content">${grade.toLocaleString("de-DE")} ${
      grades[index + 1] ? " &ndash; " + grades[index + 1] + "</br>" : "+"
    }</span></div> 
    `;
  });
  return div;
};
legend.addTo(map);

// add scale
const scale = L.control.scale({
  metric: true,
  imperial: false,
});
scale.addTo(map);
