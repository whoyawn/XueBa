use rocket::serde::json::Json;
use serde::Serialize;

#[derive(Serialize)]
struct Message {
    message: String,
}

#[get("/")]
fn hello() -> Json<Message> {
    Json(Message {
        message: "Hello from Rust Rocket!".to_string(),
    })
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![hello])
        .configure(rocket::Config::figment()
            .merge(("port", 8000)))
}
