const init = require("./tracer")
const { meter } = init("user-service", 8091)

const { trace, context } = require("@opentelemetry/api")
const axios = require("axios")
const express = require("express")

const app = express();

app.get("/user", async (req, res) => {
    const url = "https://mocki.io/v1/d4867d8b-b5d5-4a48-a4ab-79131b5809b8";
    const apiResponse = await axios(url);
    const randomIndex = Math.floor(Math.random() * apiResponse.data.length + 0)
    const activeSpan = trace.getSpan(context.active());
    activeSpan.addEvent("A number was randomized", {
        randomIndex
    })
    res.json(apiResponse.data[randomIndex])
})

app.listen(8090)
console.log(`users service is up and running on http://localhost:8090`)