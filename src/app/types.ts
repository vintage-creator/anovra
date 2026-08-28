export type View = "landing" | "dashboard" | "catalog" | "skintest" | "admin" | "adminlogin" | "shop" | "brand" | "signin" | "signup" | "customersignup" | "forgotpassword" | "resetpassword" | "teamlogin" | "teamdashboard" | "branddashboard" | "about" | "contact" | "userdashboard";

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
