import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import authConfig from "./auth.config"
import { db } from "./lib/db"
import { getUserById } from "./data/user"
import { UserRole } from "@prisma/client"

export const { auth, handlers, signIn, signOut } = NextAuth({
    pages:{
        signIn:"/auth/login",
        error:"/auth/error", //for error routing page
    },
    events:{
        async linkAccount({ user }) {
            await db.user.update({
                where:{id:user.id},
                data:{emailVerified:new Date()}
            })
        }
    },
    callbacks:{
        // async signIn({ user }) {
        //     if (!user?.id) return false

        //     const existingUser = await getUserById(user.id)
        //     if (!existingUser || !existingUser.emailVerified) {
        //         return false
        //     }
        //     return true
        // },
        async session({token, session}){
            // console.log({
            //     SessionToken: token,
            // })
            if(token.sub && session.user){
                session.user.id=token.sub
            }

            // session.user.customField="custom value"

            if(token.role && session.user){
                session.user.role=token.role as UserRole
            }
            return session
        },
        async jwt({token}){
            if(!token.sub){
                return token
            }

            const existingUser=await getUserById(token.sub)

            if(!existingUser){
                return token
            }

            token.role=existingUser.role
            return token
        }
    },
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig,
})