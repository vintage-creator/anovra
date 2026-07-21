export type View = "landing" | "dashboard" | "catalog" | "skintest" | "admin" | "adminlogin" | "shop" | "signin" | "signup" | "teamlogin" | "teamdashboard" | "about" | "contact" | "userdashboard";

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
