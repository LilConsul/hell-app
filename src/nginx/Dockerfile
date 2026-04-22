FROM nginx:1.27.3-alpine-slim

# Install tools needed by entrypoint certificate generation during image build,
# avoiding flaky package downloads at container startup.
RUN apk add --no-cache openssl
