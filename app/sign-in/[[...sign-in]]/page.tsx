import { SignIn } from "@clerk/nextjs";
import { AuthProvider } from "@/components/AuthProvider";

export default function SignInPage() {
  return (
    <AuthProvider>
      <div className="flex min-h-[80vh] items-center justify-center bg-[#F9FAFB] px-4 py-12">
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </div>
    </AuthProvider>
  );
}
