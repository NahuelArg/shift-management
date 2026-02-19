import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

interface GoogleProfile {
  emails: Array<{ value: string; verified: boolean }>;
  name: { givenName: string; familyName: string };
  photos: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientID || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      clientID,
      clientSecret,
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,

    done: (error: any, user?: any) => void,
  ): void {
    const { emails, name, photos } = profile;
    const email = emails[0].value;
    const firstName = name.givenName;
    const lastName = name.familyName;
    const photo = photos[0].value;

    const user = {
      email,
      firstName,
      lastName,
      photo,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
