// import { io } from 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.0/socket.io.esm.min.js';

let socket = null

let mode = null;

// connection to spacecode server
import('https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.0/socket.io.esm.min.js')
.then(async (io) => {
    socket = await io.io("http://localhost:5454/", {
    // socket = await io.io("https://license.spacecode.in/", {
        reconnectionDelayMax: 10000,
        auth: {
            token: "v3"
        }
    });
    await init()
}).catch(err => {
    console.log(err)
})

// const socket = io("https://license.spacecode.in/", {


let deviceConnected = false;
let selectedSocketId = null
let connectedDeviceSerialNumber = null


// listener for tags getting read by the reader
async function addTagListener(callback) {
    socket.on("receive_addTag", (response) => {
        callback(response)
    })
}

// Listener for scan getting started
async function scanStartedListener(callback) {
    socket.on("receive_scanStarted", (response) => {
        console.log(response);
        callback(response)
    })
}

// Listener for scan getting stopped
// async function scanStopListener(callback) {
//     socket.on("receive_stopScan", (response) => {
//         console.log(response);
//         callback(response)
//     })
// }

// Listener for scan getting completed
async function scanCompletedListener(callback) {
    socket.on("receive_scanCompleted", (response) => {
        console.log(response);
        callback(response);
    })
}

// listener for the connection getting established with spacecode
async function connectionListener(callback) {

    socket.emit("connection", {"deviceType": "client"}, (response) => {
        console.log(response);
        let sockets = response.sockets;
        let connectionSuccess = false;
        sockets.forEach((socketItem) => {
            if (!connectionSuccess) {
                socket.emit("generic", {
                    "eventName": "getDevices",
                    "socketId": socketItem.socketId
                }, (response1) => {
                    selectedSocketId = socketItem.socketId
                    connectionSuccess = true;
                    console.log(response1)
                    callback(response1)
                })
            }
        })
    })

}

// function to connect device with deviceId whether the device id can be a serial number of the device or the ipAddress
async function connectDevice(deviceId, callback) {

    console.log(selectedSocketId);
    console.log(deviceId);

    socket.emit("send_connectDevice", {
        "socketId": selectedSocketId,
        "deviceId": deviceId
    }, (response) => {
        console.log(response)
        if (response.status) {
            deviceConnected = true;
            connectedDeviceSerialNumber = response.deviceSerialNumber;
            mode = deviceId.includes(":") ? "ethMode" : "usbMode"
        }
        callback(response)
    })
}

// function to disconnect the device
async function disconnectDevice(callback) {
    socket.emit("generic", {
        "eventName": "disconnectDevice",
        "socketId": selectedSocketId,
        "deviceId": connectedDeviceSerialNumber
    }, (response) => {
        if (response.status) {
            deviceConnected = false;
            connectedDeviceSerialNumber = null;
        }
        callback(response)
    })
}

// function to start the scan
async function startScan(mode, callback) {
    socket.emit("generic", {
        "eventName": "startScan",
        "socketId": selectedSocketId,
        "deviceId": connectedDeviceSerialNumber,
        "scanMode": mode
    }, (response) => {
        console.log(response)
        callback(response)
    })
}

// function to stop the scan and it will also provide the callback that the scan has been stopped
async function stopScan(callback) {
    socket.emit("generic", {
        "eventName": "stopScan",
        "socketId": selectedSocketId,
        "deviceId": connectedDeviceSerialNumber
    }, (response) => {
        console.log(response)
        callback(response)
    })
}

// function to refresh the tags while having continues mode
async function refreshTags(callback) {
    socket.emit("generic", {
        "eventName": "refreshTags",
        "socketId": selectedSocketId,
        "deviceId": connectedDeviceSerialNumber,
    }, (response) => {
        console.log("module:",response)
        callback(response)
    })
}

// function to trigger led with the response
function ledOn(tags, callback) {
    socket.emit("generic", {
        "eventName": "ledOn",
        "socketId": selectedSocketId,
        "mode": mode,
        "list": tags,
        "deviceId": connectedDeviceSerialNumber
    }, (response) => {
        console.log(response);
        callback(response)
    })
}

// function to turn off the led with the response
function ledOff(callback) {
    socket.emit("generic", {
        "eventName": "ledOff",
        "socketId": selectedSocketId,
        "deviceId": connectedDeviceSerialNumber
    }, (response) => {
        callback(response)
    })
}