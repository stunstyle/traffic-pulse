const fs = require('fs');

// 1. Load the JSON data from a file
// Replace 'data.json' with the actual path to your file
const rawData = fs.readFileSync('cameras_with_paths.json', 'utf8');
const data = JSON.parse(rawData);

// 2. Extract unique roadNum values
// We use .map() to get the road numbers and Set to filter uniqueness
const uniqueRoads = [...new Set(data.map(item => item.roadNum))];

// 3. Filter out any null or undefined values if necessary
const filteredRoads = uniqueRoads.filter(road => road != null);

// 4. Output the result
console.log(JSON.stringify(filteredRoads, null, 2));

// Optional: Save the result to a new file
// fs.writeFileSync('unique_roads.json', JSON.stringify(filteredRoads, null, 2));