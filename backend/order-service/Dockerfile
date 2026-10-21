FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY backend/ backend/

RUN mvn -f backend/pom.xml -pl order-service -am -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
RUN groupadd --system app && useradd --system --gid app --home-dir /app app
COPY --from=build /workspace/backend/order-service/target/order-service-0.0.1-SNAPSHOT.jar /app/order-service.jar

USER app:app
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/order-service.jar"]