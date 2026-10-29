# Build from the repository root: docker build -f backend/Dockerfile .
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace/backend
COPY backend/gradle gradle
COPY backend/gradlew backend/build.gradle backend/settings.gradle ./
COPY backend/src src
RUN chmod +x gradlew && ./gradlew --no-daemon bootJar

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S devmeet && adduser -S devmeet -G devmeet
WORKDIR /app
COPY --from=build --chown=devmeet:devmeet /workspace/backend/build/libs/*-SNAPSHOT.jar app.jar
USER devmeet
ENV SERVER_ADDRESS=0.0.0.0
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
