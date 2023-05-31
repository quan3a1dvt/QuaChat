sdk = require("matrix-js-sdk");
const client = sdk.createClient({ baseUrl: "https://matrix.org" });
console.log(client)
client.publicRooms(function (err, data) {
    console.log("Public Rooms: %s", JSON.stringify(data));
});