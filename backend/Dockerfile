FROM rust:1.82
WORKDIR /app
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
COPY . .
EXPOSE 8080
CMD ["cargo", "run"]
