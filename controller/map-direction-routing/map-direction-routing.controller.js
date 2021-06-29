const fetch = require("node-fetch");
const StatusModel = require("../../model/status.model");

const google_api_key = "AIzaSyB0aRG_lW_Ll2yRrmF1TPMcMt-nyOozXEw";
const mapbox_api_key = "pk.eyJ1IjoiY2hlZWtlYW4xOTk3IiwiYSI6ImNrbXoxa3I4MDA1bTkydmwydWtyMWoxZmgifQ.QiM6rCDgQTh5nNVFUO9CAA"

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
        if (data.status === "OK") {
            return {
                distanceValue: data.rows[0].elements[0].distance.value,
                distanceText: data.rows[0].elements[0].distance.text,
                durationValue: data.rows[0].elements[0].duration.value,
                durationText: data.rows[0].elements[0].duration.text
            }
        } else {
            console.log("Error", data);
            return null;
        }
    } catch (error) {
        console.log("Error", error.message);
        return null;
    }
}

getDistanceDuration = async (orderList) => {
    let origin = orderList[0].recipientLatitude + "," + orderList[0].recipientLongitude;
    let destination = orderList[orderList.length - 1].recipientLatitude + "," + orderList[orderList.length - 1].recipientLongitude;

    let coordinateList = "";
    for (let i in orderList) {
        coordinateList += "via:" + orderList[i].recipientLatitude + "," + orderList[i].recipientLongitude;
        if (i < (orderList.length - 1)) {
            coordinateList += "|";
        }
    }
    const apiURL = "https://maps.googleapis.com/maps/api/directions/json?origin=" + origin +
        "&destination=" + destination + "&waypoints=" + coordinateList + "&departure_time=now&key=" + google_api_key;

    const data = await fetch(apiURL).catch(err => {
        console.log("Error: ", err.message)
        return {
            optimizeStatus: false,
            message: err.message
        }
    });

    const result = await data.json();

    return {
        text: result.routes[0].legs[0].duration_in_traffic.text,
        value: result.routes[0].legs[0].duration_in_traffic.value,
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

    const trafficDuration = await getDistanceDuration(orderList);

    const baseUrl = "https://api.mapbox.com/directions/v5/mapbox/driving/";
    let coordinateList = "";
    for (let i in orderList) {
        coordinateList += orderList[i].recipientLongitude + "," + orderList[i].recipientLatitude;
        if (i < (orderList.length - 1)) {
            coordinateList += ";";
        }
    }
    const apiURL = baseUrl + coordinateList + "?overview=full&annotations=distance,duration&alternatives=false&steps=true&access_token=" + mapbox_api_key;
    const data = await fetch(apiURL).catch(err => console.log("Error: ", err.message));
    const parseData = await data.json();

    console.log(parseData);
    console.log(trafficDuration);
    console.log(parseData.routes[0].legs);
    if (parseData === null) {
        return null;
    }
    const totalDistanceTime = {
        totalDistance: (parseData.routes[0].distance / 1000).toFixed(2),
        totalDuration: (trafficDuration.value),
        totalTrafficDurationText: trafficDuration.text,
        totalTrafficDurationValue: trafficDuration.value,
    };

    return totalDistanceTime;
}

getDuration = async (req, res) => {
    const orderList = req.body.orderList;
    const companyAddress = req.body.companyAddress;
    const roundTrip = req.body.roundTrip;

    let companyAddressCoordinate = {
        recipientLongitude: companyAddress.longitude,
        recipientLatitude: companyAddress.latitude
    };
    orderList.unshift(companyAddressCoordinate);
    if (roundTrip) {
        orderList.push(companyAddressCoordinate);
    }
    const trafficDuration = await getDistanceDuration(orderList);
    console.log(orderList);
    console.log(trafficDuration);
    const statusModel = new StatusModel();

    return res.json(statusModel.success(trafficDuration));
}

const MapDirectionRoutingController = {
    getGeoCoding: getGeoCoding,
    getDistance: getDistance,
    optimizeRoute: optimizeRoute,
    getTotalDistanceTime: getTotalDistanceTime,
    calcOrderTotalDistanceTime: calcOrderTotalDistanceTime,
    getDuration:getDuration,
};

module.exports = MapDirectionRoutingController;
