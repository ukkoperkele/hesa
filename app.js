const map = L.map('map').setView([60.16599, 24.93989], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentStreetName = null;
let highlightedStreet = null;

const radiusSlider = document.getElementById("radius");
const radiusValue = document.getElementById("radius-value");

radiusSlider.addEventListener("input", () => {
    radiusValue.textContent = radiusSlider.value;
    updateCircle();
});

async function fetchStreets() {
    const bbox = [
        60.16599 - 0.0135, // minLat
        24.93989 - 0.0135, // minLon
        60.16599 + 0.0135, // maxLat
        24.93989 + 0.0135  // maxLon
    ].join(',');

    const overpassQuery = `
        [out:json];
        way["highway"]["name"](${bbox});
        out body geom;>;out skel qt;
    `;

    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(overpassQuery);
    const response = await fetch(url);
    const data = await response.json();

    const streets = data.elements.filter(element => element.type === 'way');

    // Group streets by name
    const groupedStreets = streets.reduce((grouped, street) => {
        const name = street.tags.name;
        if (!grouped[name]) {
            grouped[name] = [];
        }
        grouped[name].push(street);
        return grouped;
    }, {});

    return groupedStreets;
}

function getRandomStreet(streetGroups) {
    const streetNames = Object.keys(streetGroups);
    const randomStreetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    return { name: randomStreetName, segments: streetGroups[randomStreetName] };
}

function highlightStreet(street) {
    if (highlightedStreet) {
        highlightedStreet.forEach(segment => map.removeLayer(segment));
    }

    highlightedStreet = street.segments.map(segment => {
        const coordinates = segment.geometry.map(coord => [coord.lat, coord.lon]);
        return L.polyline(coordinates, { color: 'red' }).addTo(map);
    });
}

async function initQuiz() {
    const streetGroups = await fetchStreets();
    const randomStreet = getRandomStreet(streetGroups);
    currentStreetName = randomStreet.name;
    highlightStreet(randomStreet);
}

function checkAnswer() {
    const userAnswer = document.getElementById("street-name").value.trim();
    const resultElement = document.getElementById("result");

    if (userAnswer.toLowerCase() === currentStreetName.toLowerCase()) {
        resultElement.textContent = "Correct!";
    } else {
        resultElement.textContent = `Incorrect. The correct answer is ${currentStreetName}.`;
    }

    document.getElementById("street-name").value = ""; // Clear the input field
    initQuiz();
}

function updateCircle() {
    if (circle) {
        map.removeLayer(circle);
    }
    circle = L.circle([60.16599, 24.93989], {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.1,
        radius: radiusSlider.value
    }).addTo(map);
}

initQuiz();

let circle = L.circle([60.16599, 24.93989], {
    color: 'blue',
    fillColor: '#30f',
    fillOpacity: 0.1,
    radius: radiusSlider.value
}).addTo(map);

document.getElementById("submit-button").addEventListener("click", checkAnswer);

document.getElementById("street-name").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        checkAnswer();
    }
});
