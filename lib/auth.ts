import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "email public_profile pages_show_list pages_read_engagement pages_manage_posts pages_manage_engagement pages_read_user_content",
                },
            },
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user || !user.password) {
                    throw new Error("Invalid email or password");
                }

                // Verify password
                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid email or password");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("SignIn Callback:", { provider: account?.provider, email: user.email, id: user.id });

            // Save Google OAuth users to database
            if (account?.provider === "google" && user.email) {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    });
                    console.log("Google User Lookup:", existingUser ? "Found" : "Not Found");

                    if (!existingUser) {
                        const newUser = await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name,
                                image: user.image,
                                emailVerified: new Date(),
                            },
                        });
                        console.log("Created Google User:", newUser.id);
                    } else if (!existingUser.image && user.image) {
                        await prisma.user.update({
                            where: { email: user.email },
                            data: { image: user.image },
                        });
                    }
                } catch (e) {
                    console.error("Error in Google signIn:", e);
                    return false; // Block sign in on error
                }
            }

            // Save Facebook OAuth users to database
            if (account?.provider === "facebook" && user.email) {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    });
                    console.log("Facebook User Lookup:", existingUser ? "Found" : "Not Found");

                    if (!existingUser) {
                        const newUser = await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name,
                                image: user.image,
                                emailVerified: new Date(),
                            },
                        });
                        console.log("Created Facebook User:", newUser.id);
                    } else if (!existingUser.image && user.image) {
                        await prisma.user.update({
                            where: { email: user.email },
                            data: { image: user.image },
                        });
                    }
                } catch (e) {
                    console.error("Error in Facebook signIn:", e);
                    return false; // Block sign in on error
                }
            }

            return true;
        },
        async jwt({ token, user, account }) {
            // Initial sign in - store user info and access token
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image;
            }

            // Store Facebook access token in JWT
            if (account?.provider === "facebook" && account.access_token) {
                token.accessToken = account.access_token;
            }

            // Store access token for other OAuth providers too
            if (account?.access_token) {
                token.accessToken = account.access_token;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.image = token.picture as string;
            }

            // Expose access token in session
            if (token.accessToken) {
                (session as any).accessToken = token.accessToken;
            }

            return session;
        },
        async redirect({ url, baseUrl }) {
            // Redirect to dashboard after successful login
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            if (new URL(url).origin === baseUrl) return url;
            return `${baseUrl}/dashboard`;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
});
