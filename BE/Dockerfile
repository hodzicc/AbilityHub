FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG SERVICE_NAME
WORKDIR /src

COPY . .

RUN dotnet restore "Services/AbilityHub.${SERVICE_NAME}/AbilityHub.${SERVICE_NAME}.csproj"

WORKDIR "/src/Services/AbilityHub.${SERVICE_NAME}"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
ARG SERVICE_NAME
WORKDIR "/src/Services/AbilityHub.${SERVICE_NAME}"
RUN dotnet publish "AbilityHub.${SERVICE_NAME}.csproj" -c Release -o /app/publish

FROM base AS final
ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT dotnet AbilityHub.${SERVICE_NAME}.dll