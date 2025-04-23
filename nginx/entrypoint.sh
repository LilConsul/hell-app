#!/bin/sh

CERT_DIR="/etc/nginx/certs"
CERT_PATH="$CERT_DIR/cert.crt"
KEY_PATH="$CERT_DIR/cert.key"

# If we don't have a certificate, generate a self-signed one
if [ ! -f "$CERT_PATH" ] || [ ! -f "$KEY_PATH" ]; then
    echo "No SSL certificates found, generating self-signed certificates..."
    apk add --no-cache openssl

    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$KEY_PATH" \
        -out "$CERT_PATH" \
        -subj "/C=PL/ST=Krakow/L=SENOM_VEX/O=SESBIAN_LEX/CN=actPoly" > /dev/null 2>&1

else
    echo "SSL certificates found."
fi

envsubst '$$FRONTEND_PORT_INTERNAL $$BACKEND_PORT_INTERNAL $$MAILHOG_UI_PORT_INTERNAL $$FLOWER_PORT_INTERNAL $$DOMAIN' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "Starting Nginx."
exec nginx -g "daemon off;"