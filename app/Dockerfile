FROM --platform=linux/arm64 golang:1.23 AS build
WORKDIR /go/src/clean-serverless-book-sample
COPY . /go/src/clean-serverless-book-sample
RUN scripts/build-handlers.sh


FROM --platform=linux/arm64 public.ecr.aws/lambda/provided:al2023 AS api
COPY --from=build /go/src/clean-serverless-book-sample/adapter/handlers/api/main ./main
ENTRYPOINT [ "./main" ]

FROM --platform=linux/arm64 public.ecr.aws/lambda/provided:al2023 AS s3event
COPY --from=build /go/src/clean-serverless-book-sample/adapter/handlers/s3event/main ./main
ENTRYPOINT [ "./main" ]

FROM --platform=linux/arm64 public.ecr.aws/lambda/provided:al2023 AS schedule
COPY --from=build /go/src/clean-serverless-book-sample/adapter/handlers/schedule/main ./main
ENTRYPOINT [ "./main" ]
