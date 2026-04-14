import { Cormorant_Garamond } from "next/font/google";

const loginDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-login-display",
  display: "swap",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className={loginDisplay.variable}>{children}</div>;
}
