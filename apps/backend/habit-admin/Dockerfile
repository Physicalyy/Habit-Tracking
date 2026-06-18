ARG JRE_IMAGE=eclipse-temurin:17-jre

FROM ${JRE_IMAGE}

WORKDIR /app

ENV JAVA_OPTS=""

COPY apps/backend/habit-admin/target/habit-admin-0.1.0-SNAPSHOT.jar /app/habit-admin.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/habit-admin.jar"]
