export const metadata = {
  title: 'ephemera. — terms of service',
};

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '80px 24px 80px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        <div style={{ fontFamily: 'var(--mono)', marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 16 }}>ephemera.</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 8 }}>terms of service</h1>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1px' }}>last updated: march 2026</div>
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.9, display: 'flex', flexDirection: 'column', gap: 40 }}>

          <section>
            <div style={headingStyle}>the basics</div>
            <p>by using ephemera you agree to these terms. if you don&rsquo;t agree, don&rsquo;t use it. that&rsquo;s it.</p>
          </section>

          <section>
            <div style={headingStyle}>one photo a day</div>
            <p>you can post one photo every 24 hours. that&rsquo;s the whole idea. your photo will be visible to your followers for 24 hours and then permanently deleted.</p>
          </section>

          <section>
            <div style={headingStyle}>what you can&rsquo;t post</div>
            <p>do not post anything that is harmful, illegal, or explicit. this includes but is not limited to:</p>
            <ul style={{ marginTop: 12, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>nudity or sexual content</li>
              <li>content that depicts or encourages violence</li>
              <li>content that harasses or targets individuals</li>
              <li>anything that violates uk or eu law</li>
            </ul>
            <p style={{ marginTop: 12 }}>we reserve the right to remove content that violates these rules without notice.</p>
          </section>

          <section>
            <div style={headingStyle}>your photos</div>
            <p>you own your photos. uploading them to ephemera does not change that.</p>
            <p style={{ marginTop: 12 }}>by uploading a photo you grant ephemera a limited, non-exclusive licence to store and display it to your followers for the duration of its 24-hour lifespan. after that it is deleted and the licence ends.</p>
            <p style={{ marginTop: 12 }}>we will never use your photos for advertising, training data, or anything outside of showing them to your followers.</p>
          </section>

          <section>
            <div style={headingStyle}>account termination</div>
            <p>we can suspend or permanently terminate accounts that repeatedly violate these terms, are used for spam, or cause harm to other users.</p>
            <p style={{ marginTop: 12 }}>you can delete your own account at any time in settings.</p>
          </section>

          <section>
            <div style={headingStyle}>the service</div>
            <p>ephemera is provided as-is. we make no guarantees about uptime, data retention beyond what is stated, or that the service will always be available. we are a small project and things break sometimes.</p>
            <p style={{ marginTop: 12 }}>we are not liable for any loss of data, loss of access, or any other damages arising from use of the service.</p>
          </section>

          <section>
            <div style={headingStyle}>governing law</div>
            <p>these terms are governed by the laws of england and wales. any disputes will be subject to the exclusive jurisdiction of the courts of england and wales.</p>
          </section>

          <section>
            <div style={headingStyle}>changes</div>
            <p>we may update these terms occasionally. if anything significant changes we will let you know. continuing to use ephemera after changes means you accept the new terms.</p>
          </section>

          <section>
            <div style={headingStyle}>contact</div>
            <p>questions: <a href="mailto:rhjtaylor@gmail.com" style={{ color: 'var(--text-primary)' }}>rhjtaylor@gmail.com</a></p>
          </section>

        </div>

        <div style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 24 }}>
          <a href="/" style={{ color: 'var(--text-muted)' }}>← back</a>
          <a href="/privacy" style={{ color: 'var(--text-muted)' }}>privacy policy</a>
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
