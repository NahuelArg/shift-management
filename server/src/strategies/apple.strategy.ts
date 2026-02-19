/*import { PassportStrategy } from "@nestjs/passport";
import {Strategy, VerifyCallback} from "passport-google-oauth20";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
    constructor(){
       super({
        clientID: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/apple/callback',
      scope: ['email', 'profile'],
       }) 
    }
    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
        const user = {
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            picture: profile.photos[0].value,
            provider: "apple",
        };
        done(null, user);
    }

}

*/
