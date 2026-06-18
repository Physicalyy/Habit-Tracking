ARG MAVEN_IMAGE=maven:3.9-eclipse-temurin-17
ARG JRE_IMAGE=eclipse-temurin:17-jre

FROM ${MAVEN_IMAGE} AS build

WORKDIR /workspace

COPY apps/backend ./apps/backend

WORKDIR /workspace/apps/backend

RUN mvn package -DskipTests

FROM ${JRE_IMAGE}

WORKDIR /app

ENV JAVA_OPTS=""

COPY --from=build /workspace/apps/backend/habit-admin/target/habit-admin-0.1.0-SNAPSHOT.jar /app/habit-admin.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/habit-admin.jar"]
