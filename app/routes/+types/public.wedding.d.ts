import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction as RemixMetaFunction } from "react-router";

export namespace Route {
    export type LoaderArgs = LoaderFunctionArgs;
    export type ActionArgs = ActionFunctionArgs;
    export type MetaFunction = RemixMetaFunction;
}
