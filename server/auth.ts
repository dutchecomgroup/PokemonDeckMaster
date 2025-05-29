import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Express } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { storage } from './storage';
import { type User as SchemaUser, type InsertUser, type InsertOAuthUser } from '@shared/schema';
import { checkRegistrationEnabled } from './middleware/registrationMiddleware';

// Extend Express.User interface to include our user properties
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends SchemaUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Password hashing function using scrypt
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Password comparison function for login
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express): void {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'pokemon-tcg-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  // Setup session and Passport middleware
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: 'Incorrect username' });
        }
        
        // If user has no password (social login), don't try to compare
        if (!user.password) {
          return done(null, false, { message: 'Invalid login method' });
        }
        
        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Incorrect password' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Configure Google OAuth Strategy
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
  
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: "https://82577490-9f69-4366-b1d2-c778227431cb-00-b10rkhba6bol.spock.replit.dev/api/auth/google/callback",
          passReqToCallback: true as true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists based on Google ID
            let user = await storage.getUserByOAuthId('google', profile.id);
            
            if (user) {
              return done(null, user);
            }
            
            // If user is logged in, link accounts
            if (req.user) {
              user = await storage.linkOAuthProvider(req.user.id, 'google', profile.id, profile);
              return done(null, user);
            }
            
            // Create a new user
            // Extract email from profile
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
            
            // Create a temporary username that will be changed by the user
            const tempUsername = `google_${profile.id}`;
            
            // Check if username already exists, create alternative if needed
            const existingUserWithUsername = await storage.getUserByUsername(tempUsername);
            const finalUsername = existingUserWithUsername 
              ? `google_${profile.id}_${Date.now()}` 
              : tempUsername;
            
            // Create new user with needsProfileCompletion flag
            const userData: any = {
              username: finalUsername,
              email,
              displayName: profile.displayName || '',
              provider: 'google',
              providerId: profile.id,
              avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
              providerData: profile,
              needsProfileCompletion: true // Flag to indicate the user needs to complete profile
            };
            
            const newUser = await storage.createOAuthUser(userData);
            
            return done(null, newUser);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Configure Facebook OAuth Strategy
  // For Facebook, we'll need additional credentials
  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
  
  if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: FACEBOOK_APP_ID,
          clientSecret: FACEBOOK_APP_SECRET,
          callbackURL: "/api/auth/facebook/callback",
          profileFields: ['id', 'displayName', 'photos', 'email'],
          passReqToCallback: true as true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists based on Facebook ID
            let user = await storage.getUserByOAuthId('facebook', profile.id);
            
            if (user) {
              return done(null, user);
            }
            
            // If user is logged in, link accounts
            if (req.user) {
              user = await storage.linkOAuthProvider(req.user.id, 'facebook', profile.id, profile);
              return done(null, user);
            }
            
            // Create a new user
            // Extract email from profile
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
            const username = `facebook_${profile.id}`;
            
            // Check if username already exists, create alternative if needed
            const existingUserWithUsername = await storage.getUserByUsername(username);
            const finalUsername = existingUserWithUsername 
              ? `facebook_${profile.id}_${Date.now()}` 
              : username;
            
            // Create new user with needsProfileCompletion flag
            const newUser = await storage.createOAuthUser({
              username: finalUsername,
              email,
              displayName: profile.displayName || '',
              provider: 'facebook',
              providerId: profile.id,
              avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
              providerData: profile,
              needsProfileCompletion: true // Flag to indicate the user needs to complete profile
            });
            
            return done(null, newUser);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Serialize and deserialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register authentication routes
  app.post('/api/register', checkRegistrationEnabled, async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Create user with hashed password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create the user data and remove confirmPassword which isn't part of the DB schema
      const { confirmPassword, ...userData } = req.body;
      
      // Check if this is the first user, if so make them an admin
      const allUsers = await storage.getAllUsers();
      const isFirstUser = allUsers.length === 0;
      
      const userToCreate: InsertUser = {
        ...userData,
        password: hashedPassword,
        role: isFirstUser ? 'admin' : 'user',
        provider: 'local'
      };

      const user = await storage.createUser(userToCreate);
      
      // Automatically log in the user after registration
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user data without sensitive information
        const userResponse = { ...user } as any;
        if (userResponse.password) delete userResponse.password;
        return res.status(201).json(userResponse);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || 'Authentication failed' });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Return user data without sensitive information
        const userResponse = { ...user } as any;
        if (userResponse.password) delete userResponse.password;
        return res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: 'Failed to logout' });
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Return user data without sensitive information
    const userResponse = { ...req.user } as any;
    if (userResponse.password) delete userResponse.password;
    return res.json(userResponse);
  });
  
  // OAuth routes for Google
  app.get('/api/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  }));

  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth' }),
    (req, res) => {
      // Check if the user needs to complete their profile
      if (req.user && req.user.needsProfileCompletion) {
        return res.redirect('/profile-completion');
      }
      // Otherwise redirect to home
      res.redirect('/');
    }
  );

  // OAuth routes for Facebook
  app.get('/api/auth/facebook', passport.authenticate('facebook', {
    scope: ['email', 'public_profile']
  }));

  app.get('/api/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect: '/auth',
      successRedirect: '/'
    })
  );
}