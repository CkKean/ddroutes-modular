const fetch = require("node-fetch");
const {google_api_key} = process.env;
const {mapbox_api_key} = process.env;

getGeoCoding = async (address) => {
    const BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json?address=";
    const url = BASE_URL + address + "&key=" + google_api_key;

    try {
        const response = await fetch(url);
        const data = await response.json();

        return {
            longitude: data.results[0].geometry.location.lng,
            latitude: data.results[0].geometry.location.lat,
            formattedAddress: data.results[0].formatted_address
        };
    } catch (error) {
        console.log(error);
    }
}

getDistance = async (req, res) => {
    const BASE_URL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric";
    let origin = req.body.fullSenderAddress;
    let destination = req.body.fullRecipientAddress;
    const url = BASE_URL + "&origins=" + origin + "&destinations=" + destination + "&key=" + google_api_key;
    try {
        console.log(url);

        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        if (data.status === "OK") {
            return {
                distanceValue: data.rows[0].elements[0].distance.value,
                distanceText: data.rows[0].elements[0].distance.text,
                durationValue: data.rows[0].elements[0].duration.value,
                durationText: data.rows[0].elements[0].duration.text
            }
        } else {
            return null;
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}

optimizeRoute = async (optimizeModel) => {

    const {orderList, companyAddress, roundTrip} = optimizeModel;

    let companyAddressCoordinate = {
        recipientLongitude: companyAddress.longitude,
        recipientLatitude: companyAddress.latitude
    };

    orderList.unshift(companyAddressCoordinate);
    if (roundTrip) {
        orderList.push(companyAddressCoordinate);
    }

    const baseUrl = "https://api.mapbox.com/optimized-trips/v1/mapbox/driving/";
    let coordinateList = "";
    for (let i in orderList) {
        coordinateList += orderList[i].recipientLongitude + "," + orderList[i].recipientLatitude;
        if (i < (orderList.length - 1)) {
            coordinateList += ";";
        }
    }

    let routeConfig = '';
    if (roundTrip) {
        routeConfig = "?source=first&destination=last&roundtrip=true"
    } else {
        routeConfig = "?source=first&destination=last&roundtrip=false"
    }

    const apiURL = baseUrl + coordinateList + routeConfig + "&access_token=" + mapbox_api_key;

    const data = await fetch(apiURL).catch(err => {
        console.log("Error: ", err.message)
        return {
            optimizeStatus: false,
            message: err.message
        }
    });
    ;
    const optimizationResult = await data.json();

    const totalDistance = optimizationResult.trips[0].distance;
    const timeNeeded = optimizationResult.trips[0].duration;

    console.log("Optimization", {
        optimizeStatus: true,
        totalDistance: totalDistance,
        timeNeeded: timeNeeded,
        wayPoints: optimizationResult.waypoints
    });
    return {
        optimizeStatus: true,
        totalDistance: totalDistance,
        timeNeeded: timeNeeded,
        wayPoints: optimizationResult.waypoints
    };
}

getTotalDistanceTime = async (orderList) => {

    const courierOrders = orderList;

    const baseUrl = "https://api.mapbox.com/directions/v5/mapbox/driving/";
    let coordinateList = "";
    for (let i in courierOrders) {
        coordinateList += courierOrders[i].recipientLongitude + "," + courierOrders[i].recipientLatitude;
        if (i < (courierOrders.length - 1)) {
            coordinateList += ";";
        }
    }
    const apiURL = baseUrl + coordinateList + "?overview=false&alternatives=true&steps=true&access_token=" + mapbox_api_key;
    const data = await fetch(apiURL).catch(err => console.log("Total Distance Time: ", err.message));
    const parseData = await data.json()

    console.log(parseData);

    const totalDistanceTime = {
        totalDistance: parseData.routes[0].distance / 1000,
        totalDuration: parseData.routes[0].duration
    };

    return totalDistanceTime;
}

calcOrderTotalDistanceTime = async (totalDistanceModel) => {

    const orderList = totalDistanceModel.orderList;
    const companyAddress = totalDistanceModel.companyAddress;
    const roundTrip = totalDistanceModel.roundTrip;

    let companyAddressCoordinate = {
        recipientLongitude: companyAddress.longitude,
        recipientLatitude: companyAddress.latitude
    };
    orderList.unshift(companyAddressCoordinate);
    if (roundTrip) {
        orderList.push(companyAddressCoordinate);
    }

    const baseUrl = "https://api.mapbox.com/directions/v5/mapbox/driving/";
    let coordinateList = "";
    for (let i in orderList) {
        coordinateList += orderList[i].recipientLongitude + "," + orderList[i].recipientLatitude;
        if (i < (orderList.length - 1)) {
            coordinateList += ";";
        }
    }

    const apiURL = baseUrl + coordinateList + "?overview=false&alternatives=false&steps=true&access_token=" + mapbox_api_key;
    const data = await fetch(apiURL).catch(err => console.log("Total Distance Time: ", err.message));
    const parseData = await data.json();
    console.log(parseData);
    const totalDistanceTime = {
        totalDistance: parseData.routes[0].distance / 1000,
        totalDuration: (parseData.routes[0].duration / 60).toFixed(0)
    };

    return totalDistanceTime;
}

const MapDirectionRoutingController = {
    getGeoCoding: getGeoCoding,
    getDistance: getDistance,
    optimizeRoute: optimizeRoute,
    getTotalDistanceTime: getTotalDistanceTime,
    calcOrderTotalDistanceTime: calcOrderTotalDistanceTime
};

module.exports = MapDirectionRoutingController;
