use warp::Filter;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    // Health check endpoint
    let health = warp::path("health")
        .map(|| "Backend is running! 🚀");

    // API routes
    let api = warp::path("api")
        .and(
            warp::path("hello")
                .and(warp::path::param())
                .map(|name: String| format!("Hello, {}!", name))
        );

    // Combine routes
    let routes = health
        .or(api)
        .with(warp::cors()
            .allow_any_origin()
            .allow_headers(vec!["content-type"])
            .allow_methods(vec!["GET", "POST", "PUT", "DELETE"]));

    println!("🚀 Backend server running on http://localhost:8080");
    println!("📋 Health check: http://localhost:8080/health");
    println!("🧪 Test API: http://localhost:8080/api/hello/world");

    warp::serve(routes)
        .run(([127, 0, 0, 1], 8080))
        .await;
}
