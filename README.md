# To start app
- npm i
- npm run items
- npm run user
- docker-compose up

## the above command spins up
    - otel-collector-agent
    - otel-collector-gateway
    - prometheus
    - jaeger

## UI Endpoints:
- items-service: :8080/data
- user-service: :8090/user
- Prometheus(metrics) - :9090
- Jaeger (traces) - :16686

*note: comment out Elastic config within gateway-config if not required*
