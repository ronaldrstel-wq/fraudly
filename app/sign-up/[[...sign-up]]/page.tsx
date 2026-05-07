import { SignUp } from "@clerk/nextjs";
import { AuthProvider } from "@/components/AuthProvider";

export default function SignUpPage() {
  return (
    <AuthProvider>
      <div className="flex min-h-[80vh] items-center justify-center bg-[#F9FAFB] px-4 py-12">
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </div>
    </AuthProvider>
  );
}
