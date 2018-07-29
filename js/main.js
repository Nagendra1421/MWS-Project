let restaurants, neighborhoods, cuisines;
var mMap;
var markers = [];
const MAPBOX_API_KEY = "pk.eyJ1IjoiaXN0aWFxdWUxOCIsImEiOiJjampjbzhxYnEyM3ZlM3Z0ZWRncHVsOXEyIn0.G92w014uYkp64EiGScJH8Q";
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker
      .register("./sw.js")
      .then(registration => console.log("SW registered", registration))
      .catch(e => console.log("Registration failed :(", e));
  }
  initMap();
  fetchNeighborhoods();
  fetchCuisines();
  /* Added for working offline */
});
/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize MapBox map, called from HTML.
 */
initMap = () => {
  self.mMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: MAPBOX_API_KEY,
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(mMap);

  updateRestaurants();
};
/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  self.markers.forEach(m => m.remove());
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML (including no-results element) and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};
/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement("li");
  li.setAttribute("aria-label", "restaurant details");
  const container_div=document.createElement("div");
  container_div.className="container";

  const image = document.createElement("img");
  image.alt = `${restaurant.name} restaurant, ${restaurant.shortDesc}`;
  image.className = "lazyload restaurant-img";
  image.src = imageUrlForRestaurant(restaurant,360,true);
  image.setAttribute("data-src", imageUrlForRestaurant(restaurant, 360));
  image.tabIndex = 0;
  container_div.append(image);
  li.appendChild(container_div);
// const rest_rating=document.createElement("h5");
//  rest_rating.className="restaurant-rating";
//  rest_rating.innerHTML="";
//  var res;
//   DBHelper.fetchRestaurantById(restaurant.id, (error, restaurant) => {
//        var average_rating=0;
//        var count=0;
//        const reviews=restaurant.reviews;
//        reviews.forEach(review=>{
//          average_rating+=parseInt(review.rating);
//          count++;
//        });
//        res=average_rating/count;
//       rest_rating.innerHTML=`&#9733; ${res.toFixed(1)}`;
//    });
//   container_div.append(rest_rating);
  const rest_container=document.createElement("div");
  rest_container.className="rest_container";
  li.append(rest_container);

  const rest_icon=document.createElement("img");
  rest_icon.className="restaurant-icon";
  rest_icon.src="./img/restaurant.svg";
  rest_icon.alt="restaurant_icon";
  rest_container.append(rest_icon);

  const name = document.createElement("h3");
  name.className="rest_name";
  name.innerHTML = restaurant.name;
  rest_container.append(name);
  

  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement("a");
  more.setAttribute("aria-label",restaurant.name + ", " + restaurant.neighborhood);
  more.setAttribute('role', 'button');
  more.setAttribute('aria-pressed', 'false');
  more.innerHTML = "View Details";
  more.href =urlForRestaurant(restaurant);
  li.append(more);
  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.mMap);
    marker.on("click",onClick);
    function onClick(){
      window.location.href=marker.options.url;
    }
    self.markers.push(marker);
  });

};

handleBtnClick = (event) => {
  toggleButton(event.target);
};
handleBtnKeyPress = (event) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    toggleButton(event.target);
  }
};
toggleButton = (element) => {
  var pressed = (element.getAttribute("aria-pressed") === "true");
  element.setAttribute("aria-pressed", !pressed);
};
