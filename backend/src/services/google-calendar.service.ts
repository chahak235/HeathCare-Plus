import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Build a fresh client authorized as a specific doctor, using their stored
   * refresh token. Each doctor has their own Google account/calendar, so we
   * can't share one OAuth2Client instance across requests for different doctors.
   */
  private clientFor(refreshToken: string): any {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    client.setCredentials({ refresh_token: refreshToken });
    return google.calendar({ version: 'v3', auth: client });
  }

  /**
   * Get authentication URL for a doctor to connect their Google Calendar.
   * `state` carries the doctor's id through the redirect so the callback
   * knows whose account to save the refresh token against.
   */
  getAuthUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force to get a refresh token every time
      state,
    });
  }

  /**
   * Exchange the one-time code Google sends back for tokens.
   */
  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Create a Google Meet event
   */
  async createMeetingEvent(
    patientName: string,
    doctorName: string,
    startTime: Date,
    endTime: Date,
    patientEmail?: string,
    doctorEmail?: string,
    doctorRefreshToken?: string | null,
    isOnline: boolean = true
  ) {
    if (!doctorRefreshToken) {
      return {
        success: false,
        error: 'Doctor has not connected Google Calendar',
      };
    }

    try {
      const calendar = this.clientFor(doctorRefreshToken);
      const start = startTime instanceof Date ? startTime : new Date(startTime);
      const end = endTime instanceof Date ? endTime : new Date(endTime);

      const event: any = {
        summary: `Medical Consultation: Dr. ${doctorName} & ${patientName}`,
        description: `${isOnline ? 'Online' : 'In-person'} medical consultation between Dr. ${doctorName} and ${patientName}`,
        start: {
          dateTime: start.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        attendees: [
          ...(patientEmail ? [{ email: patientEmail }] : []),
          ...(doctorEmail ? [{ email: doctorEmail }] : []),
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      if (isOnline) {
        event.conferenceData = {
          createRequest: {
            requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        };
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all', // Send emails to attendees
      });

      // Extract Meet link: hangoutLink may be deprecated, use conferenceData.entryPoints as fallback
      const meetLink = isOnline ? (
        response.data.hangoutLink ||
        response.data.conferenceData?.entryPoints?.find(
          (ep: { entryPointType?: string }) => ep.entryPointType === 'video'
        )?.uri ||
        null
      ) : null;

      return {
        success: true,
        meetLink,
        eventId: response.data.id,
        calendarLink: response.data.htmlLink,
      };
    } catch (error) {
      console.error('❌ Failed to create Google Meet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, updates: any) {
    try {
      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: updates,
        sendUpdates: 'all',
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Failed to update event:', error);
      return { success: false, error };
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string) {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      return { success: false, error };
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(maxResults: number = 10) {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return { success: true, events: response.data.items };
    } catch (error) {
      console.error('❌ Failed to get events:', error);
      return { success: false, error };
    }
  }
}
