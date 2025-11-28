import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    route("login", "routes/login.tsx"),

    layout("routes/protected.tsx", [
        index("routes/home.tsx"),
        route("suppliers", "routes/suppliers.tsx"),
        route("suppliers/new", "routes/suppliers.new.tsx"),
        route("suppliers/:id", "routes/suppliers.$id.tsx"),
        route("checklist", "routes/checklist.tsx"),
        route("checklist/:id", "routes/checklist.$id.tsx"),
        route("guests", "routes/guests.tsx"),
        route("guests/:id", "routes/guests.$id.tsx"),
        route("budget", "routes/budget.tsx"),
        route("budget/:id", "routes/budget.$id.tsx"),
        route("groomsmen", "routes/groomsmen.tsx"),
        route("groomsmen/new", "routes/groomsmen.new.tsx"),
        route("groomsmen/:id", "routes/groomsmen.$id.tsx"),
        route("bridal-shower", "routes/bridal-shower.tsx"),
        route("inspirations", "routes/inspirations.tsx"),
        route("assets", "routes/assets.tsx"),
        route("settings", "routes/settings.tsx"),
        route("calendar", "routes/calendar.tsx"),
    ]),

    route("public/bridal-shower", "routes/public.bridal-shower.tsx"),
] satisfies RouteConfig;
