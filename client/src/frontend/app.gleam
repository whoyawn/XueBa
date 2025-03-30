import gleam/int
import lustre
import lustre/element.{type Element}
import lustre/element/html

pub fn main() {
  let app = application()
  let assert Ok(_) = lustre.start(app, "#app", Nil)
}

fn application() -> lustre.Application(Int) {
  lustre.simple_application(init, update, view)
}

fn init() -> Int {
  0
}

fn update(model: Int, msg: Int) -> Int {
  model
}

fn view(model: Int) -> Element(Int) {
  html.div([], [
    html.h1([], [html.text("Hello from Gleam and Lustre!")]),
    html.p([], [html.text("This is a simple web application.")]),
  ])
} 