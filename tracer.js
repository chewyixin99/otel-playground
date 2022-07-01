const { AlwaysOnSampler, AlwaysOffSampler, ParentBasedSampler, TraceIdRatioBasedSampler } = require("@opentelemetry/core");
const { NodeTracerProvider } = require("@opentelemetry/node");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { BatchSpanProcessor, SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");

const { metrics } = require("@opentelemetry/api");
const { MeterProvider } = require("@opentelemetry/sdk-metrics-base")

const { PrometheusExporter } = require("@opentelemetry/exporter-prometheus");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { CollectorTraceExporter, CollectorMetricExporter } = require("@opentelemetry/exporter-collector");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http")

const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { registerInstrumentations } = require("@opentelemetry/instrumentation")
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http")
const { ExpressInstrumentation } = require("@opentelemetry/instrumentation-express")

module.exports = function init(serviceName, metricPort) {
    // Define metrics
    // const metricExporter = new PrometheusExporter({
    //     port: metricPort,
    //     startServer: true,
    // }, () => {
    //     console.log(`scrape: http://localhost:${metricPort}${PrometheusExporter.DEFAULT_OPTIONS.endpoint}`)
    // })
    const metricExporter = new CollectorMetricExporter({
        url: "http://localhost:4318/v1/metrics",
    })
    const meterProvider = new MeterProvider({
        exporter: metricExporter,
        interval: 1000,
    })
    meter = meterProvider.getMeter(serviceName)

    // Define traces
    // const traceExporter = new JaegerExporter({
    //     endpoint: "http://localhost:14268/api/traces", // jaeger
    // })
    const traceExporter = new CollectorTraceExporter({
        url: "http://localhost:4318/v1/trace"
    })

    // Define provider
    const provider = new NodeTracerProvider({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        }),
        sampler: new ParentBasedSampler({
            root: new TraceIdRatioBasedSampler(1)
        })
    })

    provider.addSpanProcessor(new BatchSpanProcessor(traceExporter))
    provider.register()

    // Instrumentation Configs
    registerInstrumentations({
        tracerProvider: provider,
        meterProvider: meterProvider,
        instrumentations: [
            new ExpressInstrumentation({
                requestHook: (span, reqInfo) => {
                    span.setAttribute('request-headers'.JSON.stringify(reqInfo.req.headers))
                }
            }),
            new HttpInstrumentation({
                // ignoreIncomingRequestHook: true,
            }),
        ]
    })

    // 
    const tracer = provider.getTracer(serviceName)

    return { meter, tracer}
}
