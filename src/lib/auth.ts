import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Ensure global Prisma client to prevent multiple instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Quick Start / Guest Login
        if (credentials.email === "guest" && credentials.password === "guest") {
          let adminUser = await prisma.user.findUnique({ where: { email: "admin@accountra.com" } });
          if (!adminUser) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            adminUser = await prisma.user.create({
              data: {
                email: "admin@accountra.com",
                name: "Admin",
                password: hashedPassword,
                role: "ADMIN"
              }
            });
          }
          return adminUser;
        }

        if (credentials.email === "admin@accountra.com" && credentials.password === "admin123") {
          let adminUser = await prisma.user.findUnique({ where: { email: "admin@accountra.com" } });
          if (!adminUser) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            adminUser = await prisma.user.create({
              data: {
                email: "admin@accountra.com",
                name: "Admin",
                password: hashedPassword,
                role: "ADMIN"
              }
            });
          }
          return adminUser;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
              password: hashedPassword,
              role: "STAFF"
            }
          });
          return newUser;
        }

        if (!user?.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid password");
        }

        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id || token.sub;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key-for-development-only",
};
