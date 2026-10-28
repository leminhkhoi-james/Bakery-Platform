FROM eclipse-temurin:21-jre
ARG HEALTH_PATH=/v3/api-docs
ENV HEALTH_PATH=${HEALTH_PATH}
RUN groupadd --system --gid 10001 app && useradd --system --uid 10001 --gid app app
WORKDIR /app
COPY --chown=app:app application.jar /app/application.jar
USER app:app
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/${SERVER_PORT:-8080}; printf "GET %s HTTP/1.0\r\nHost: localhost\r\n\r\n" "$HEALTH_PATH" >&3; read -r status <&3; [[ "$status" == *" 200 "* ]]'
ENTRYPOINT ["java", "-jar", "/app/application.jar"]
