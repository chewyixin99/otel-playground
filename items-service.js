const init = require("./tracer")
const { meter } = init("items-service", 8081)

const { trace, context } = require("@opentelemetry/api")
const axios = require("axios")
const express = require("express")

const app = express();
const httpCounter = meter.createCounter("http_calls");

app.use((req, res, next) => {
    httpCounter.add(1);
    next();
}) 

app.get("/data", async(req, res) => {
    try {
        if (req.query['fail']) {
            throw new Error("Request failed")
        }
        const user = await axios.get("http://localhost:8090/user");
        res.json(user.data)
    } catch (e) {
        const activeSpan = trace.getSpan(context.active());
        console.error("Critical error", { traceId: activeSpan.spanContext().traceId} )
        activeSpan.recordException(e);
        res.sendStatus(500);
    }
})

app.listen(8080)
console.log("Items service is running on http://localhost:8080")