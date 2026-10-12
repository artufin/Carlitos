import type { Metadata } from "next";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = { title: "Ingresar" };

// NOT IMPLEMENTED (MVP): visual-only login. No code is sent or validated.
export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <LoginForm />
    </div>
  );
}
