import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [],
} satisfies NextAuthConfig;
