import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    route("login", "routes/login.tsx"),

    layout("routes/protected.tsx", [
        index("routes/home.tsx"),
        route("suppliers", "routes/suppliers.tsx"),
        route("suppliers/new", "routes/suppliers.new.tsx"),
        route("checklist", "routes/checklist.tsx"),
        route("guests", "routes/guests.tsx"),
        route("budget", "routes/budget.tsx"),
        route("groomsmen", "routes/groomsmen.tsx"),
        route("groomsmen/new", "routes/groomsmen.new.tsx"),
        route("groomsmen/:id", "routes/groomsmen.$id.tsx"),
        route("bridal-shower", "routes/bridal-shower.tsx"),
        route("inspirations", "routes/inspirations.tsx"),
        route("assets", "routes/assets.tsx"),
        route("settings", "routes/settings.tsx"),
    ]),
] satisfies RouteConfig;
