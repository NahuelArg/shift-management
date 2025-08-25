import { PassportStrategy } from "@nestjs/passport";
import {Strategy, VerifyCallback} from "passport-google-oauth20";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(){
       super({
        clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
       }) 
    }
    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
        const user = {
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            picture: profile.photos[0].value,
            provider: "google",
        };
        done(null, user);
    }

}

