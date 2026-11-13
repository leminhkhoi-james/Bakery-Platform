FROM golang:1.23-bookworm AS build
ARG MINIO_RELEASE=RELEASE.2024-11-07T00-52-20Z
RUN git clone --depth 1 --branch ${MINIO_RELEASE} https://github.com/minio/minio.git /src
WORKDIR /src
RUN CGO_ENABLED=0 go build -trimpath -o /out/minio .

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system minio && useradd --system --gid minio minio \
    && mkdir /data && chown minio:minio /data
COPY --from=build /out/minio /usr/local/bin/minio
COPY --from=build /src/LICENSE /licenses/minio-LICENSE
USER minio:minio
EXPOSE 9000 9001
ENTRYPOINT ["minio"]
