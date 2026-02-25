import { redirect } from "@sveltejs/kit";

export function load() {
  redirect(301, "https://correlaid.org/impressum/");
}
