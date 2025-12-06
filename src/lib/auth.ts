import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Admin Access",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const validUser = process.env.ADMIN_USER || "admin";
                const validPass = process.env.ADMIN_PASSWORD || "admin123";

                if (
                    credentials?.username === validUser &&
                    credentials?.password === validPass
                ) {
                    return { id: "1", name: "Admin User", email: "admin@local" };
                }
                return null;
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "super_secret_key_change_me",
};
