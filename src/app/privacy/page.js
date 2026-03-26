export const metadata = {
  title: 'ephemera. — privacy policy',
};

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '80px 24px 80px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        <div style={{ fontFamily: 'var(--mono)', marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 16 }}>ephemera.</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 8 }}>privacy policy</h1>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1px' }}>last updated: 26 march 2026</div>
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.9, display: 'flex', flexDirection: 'column', gap: 40 }}>

          <section>
            <div style={headingStyle}>what we collect</div>
            <p>when you create an account we collect your email address and the username you choose. if you sign in with google we receive your google email address — nothing else. when you upload a photo we store the image and any caption you add. we also store a record of who follows you and who you follow.</p>
            <p style={{ marginTop: 12 }}>you may optionally upload a profile photo. this is stored on cloudinary and remains until you replace or delete it.</p>
            <p style={{ marginTop: 12 }}>comments you write and notifications you receive are stored and automatically deleted when the post they relate to expires. we do not collect your real name, phone number, location, or any payment information.</p>
          </section>

          <section>
            <div style={headingStyle}>how long we keep it</div>
            <p>photos and captions are automatically deleted 24 hours after they are posted. that&rsquo;s the point of the app.</p>
            <p style={{ marginTop: 12 }}>your account information (email, username, follower list) is kept until you delete your account. you can do this at any time in settings.</p>
          </section>

          <section>
            <div style={headingStyle}>how it&rsquo;s stored</div>
            <p>photos are stored on cloudinary. account data is stored in mongodb atlas. both services use encrypted storage. we use vercel to run the application.</p>
            <p style={{ marginTop: 12 }}>we do not store passwords in plain text. passwords are hashed using bcrypt before being saved.</p>
          </section>

          <section>
            <div style={headingStyle}>third parties</div>
            <p>we do not sell, share, or rent your data to anyone. ever.</p>
            <p style={{ marginTop: 12 }}>the only third-party services we use are cloudinary (image storage), mongodb atlas (database), vercel (hosting), resend (transactional email for password resets), and google (optional sign-in via oauth). each has their own privacy policy governing how they handle infrastructure-level data.</p>
          </section>

          <section>
            <div style={headingStyle}>deleting your data</div>
            <p>you can delete your account from the settings page. this permanently removes your profile, follower relationships, and any remaining posts. it cannot be undone.</p>
            <p style={{ marginTop: 12 }}>if you want a copy of your data or want to request deletion via email, contact us at <a href="mailto:rhjtaylor@gmail.com" style={{ color: 'var(--text-primary)' }}>rhjtaylor@gmail.com</a>.</p>
          </section>

          <section>
            <div style={headingStyle}>gdpr — uk &amp; eu users</div>
            <p>if you are in the uk or eu you have the right to access, correct, or delete the personal data we hold about you. you also have the right to object to processing and to data portability.</p>
            <p style={{ marginTop: 12 }}>to exercise any of these rights, email <a href="mailto:rhjtaylor@gmail.com" style={{ color: 'var(--text-primary)' }}>rhjtaylor@gmail.com</a>. we will respond within 30 days.</p>
          </section>

          <section>
            <div style={headingStyle}>cookies</div>
            <p>we use a single httponly cookie to keep you logged in. no tracking cookies, no analytics, no advertising cookies.</p>
          </section>

          <section>
            <div style={headingStyle}>contact</div>
            <p>questions about this policy: <a href="mailto:rhjtaylor@gmail.com" style={{ color: 'var(--text-primary)' }}>rhjtaylor@gmail.com</a></p>
          </section>

        </div>

        <div style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 24 }}>
          <a href="/" style={{ color: 'var(--text-muted)' }}>← back</a>
          <a href="/terms" style={{ color: 'var(--text-muted)' }}>terms of service</a>
        </div>

      </div>
    </div>
  );
}

const headingStyle = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: 'var(--text-primary)',
  marginBottom: 12,
};
